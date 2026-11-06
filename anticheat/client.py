"""FragZoneTV Anti-Cheat 2.0 — opt-in Windows 10/11 diagnostic client.

Process names and CS2 executable checksum are local diagnostic heuristics, not proof of cheating.
No file uploads, injection, hidden background surveillance, or automatic bans.
"""
import hashlib
import json
import os
import platform
import threading
import time
import urllib.error
import urllib.request
import tkinter as tk
from pathlib import Path

import psutil

API = "https://svcbxbovsjslfduogjyt.supabase.co"
PUBLIC_KEY = "sb_publishable_5y0mlwG1w-DVMjmMIphMhw_DpZ7fZaB"
VERSION = "2.0"
INTERVAL = 25
BG = "#0B0E15"
CARD = "#171D27"
FIELD = "#202936"
LINE = "#2D3747"
RED = "#E33443"
WHITE = "#F2F5FA"
MUTED = "#97A6BC"
GREEN = "#43D296"
YELLOW = "#E8B75C"
# Exact executable-name matching only; these are commonly legitimate debugging utilities.
REVIEW_NAMES = {
    "cheatengine-x86_64.exe": "Cheat Engine",
    "cheatengine.exe": "Cheat Engine",
    "x64dbg.exe": "x64dbg",
    "x32dbg.exe": "x32dbg",
    "ollydbg.exe": "OllyDbg",
    "processhacker.exe": "Process Hacker",
    "reclass.net.exe": "ReClass",
    "windbg.exe": "WinDbg",
}
STATE_DIR = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "FZTVAntiCheat"
STATE_FILE = STATE_DIR / "baseline.json"


def api(method, path, payload=None, token=None, prefer=None):
    headers = {"apikey": PUBLIC_KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if prefer:
        headers["Prefer"] = prefer
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(API + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=14) as response:
            data = response.read().decode("utf-8")
            return json.loads(data) if data else {}
    except urllib.error.HTTPError as exc:
        try:
            problem = json.loads(exc.read().decode("utf-8"))
            msg = problem.get("message") or problem.get("msg") or problem.get("error_description")
        except Exception:
            msg = None
        raise RuntimeError(msg or "Ошибка HTTP " + str(exc.code)) from None
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RuntimeError("Нет связи с FZTV: " + str(exc)) from None


def windows_version():
    try:
        build = int(platform.version().split(".")[-1])
    except (ValueError, IndexError):
        build = 0
    return "Windows 11" if platform.release() == "11" or build >= 22000 else "Windows 10"


def scan_processes():
    names = set()
    game_path = None
    try:
        for proc in psutil.process_iter(["name", "exe"]):
            name = (proc.info.get("name") or "").lower()
            if name in REVIEW_NAMES:
                names.add(REVIEW_NAMES[name])
            if name == "cs2.exe" and game_path is None:
                game_path = proc.info.get("exe")
    except (psutil.AccessDenied, psutil.NoSuchProcess, OSError):
        pass
    return sorted(names), game_path


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as inp:
        for block in iter(lambda: inp.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def local_baseline(path, digest):
    # Save one local baseline per CS2 executable path; don't upload player file paths.
    key = hashlib.sha256(os.path.normcase(path).encode("utf-8")).hexdigest()
    try:
        saved = json.loads(STATE_FILE.read_text(encoding="utf-8")) if STATE_FILE.exists() else {}
    except (OSError, ValueError):
        saved = {}
    before = saved.get(key)
    if before is None:
        saved[key] = digest
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(saved), encoding="utf-8")
        return "baseline_created"
    return "unchanged" if before == digest else "changed"


def txt(parent, value, size=10, color=WHITE, bold=False, bg=BG, **extra):
    return tk.Label(parent, text=value, bg=bg, fg=color,
                    font=("Segoe UI", size, "bold" if bold else "normal"), **extra)


def action(parent, title, command, bg=RED):
    return tk.Button(parent, text=title, command=command, bg=bg, fg=WHITE,
                     activebackground="#B82A39", activeforeground=WHITE,
                     font=("Segoe UI", 10, "bold"), relief="flat", borderwidth=0,
                     cursor="hand2", padx=15, pady=12)


class Window:
    def __init__(self, root):
        self.root = root
        self.root.title("FZTV Anti-Cheat 2.0")
        self.root.geometry("510x710")
        self.root.minsize(450, 610)
        self.root.configure(bg=BG)
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.uid = None
        self.email = ""
        self.access = None
        self.refresh = None
        self.expiry = 0
        self.token_lock = threading.Lock()
        self.active = False
        self.connected = False
        self.closing = False
        self.generation = 0
        self.status = {"process": "Не проверено", "integrity": "Не проверено",
                       "cs2": "Не запущена", "warning": "Нет предупреждений"}
        self.seen_events = set()
        self.show_login()

    def ui(self, callback):
        if not self.closing:
            try:
                self.root.after(0, callback)
            except (RuntimeError, tk.TclError):
                pass

    def worker(self, callback):
        threading.Thread(target=callback, daemon=True).start()

    def shell(self, subtitle):
        for child in self.root.winfo_children():
            child.destroy()
        # Header and footer always take their own rows; content is never placed
        # at absolute pixel coordinates, so resizing cannot hide the main button.
        header = tk.Frame(self.root, bg=BG, padx=24, pady=17)
        header.pack(fill="x", side="top")
        brand = tk.Frame(header, bg=BG)
        brand.pack(anchor="w")
        txt(brand, "FZTV ", 19, WHITE, True).pack(side="left")
        txt(brand, "ANTI-CHEAT", 19, RED, True).pack(side="left")
        txt(header, subtitle, 9, MUTED).pack(anchor="w", pady=(3, 11))
        tk.Frame(header, bg=LINE, height=1).pack(fill="x")
        footer = tk.Frame(self.root, bg=BG, padx=24, pady=12)
        footer.pack(side="bottom", fill="x")
        content = tk.Frame(self.root, bg=BG, padx=24)
        content.pack(side="top", fill="both", expand=True)
        return content, footer

    def show_login(self):
        content, footer = self.shell("PLAYER AUTHENTICATION  •  WINDOWS 10 / 11")
        txt(content, "⬡", 55, RED, True).pack(pady=(25, 0))
        txt(content, "Вход в античит", 20, WHITE, True).pack(pady=(0, 4))
        txt(content, "Один аккаунт для сайта и клиента FZTV", 10, MUTED).pack(pady=(0, 22))
        txt(content, "ЭЛЕКТРОННАЯ ПОЧТА", 9, MUTED, True).pack(anchor="w")
        self.email_field = tk.Entry(content, font=("Segoe UI", 11), bg=FIELD, fg=WHITE,
                                    insertbackground=WHITE, relief="flat")
        self.email_field.pack(fill="x", ipady=11, pady=(7, 16))
        txt(content, "ПАРОЛЬ", 9, MUTED, True).pack(anchor="w")
        self.password_field = tk.Entry(content, font=("Segoe UI", 11), bg=FIELD, fg=WHITE,
                                       insertbackground=WHITE, relief="flat", show="•")
        self.password_field.pack(fill="x", ipady=11, pady=(7, 5))
        show = tk.BooleanVar(value=False)
        tk.Checkbutton(content, text="Показать пароль", variable=show,
                       command=lambda: self.password_field.configure(show="" if show.get() else "•"),
                       bg=BG, fg=MUTED, selectcolor=CARD, activebackground=BG,
                       activeforeground=WHITE, bd=0).pack(anchor="w", pady=(5, 15))
        self.login_button = action(content, "ВОЙТИ В FZTV", self.login)
        self.login_button.pack(fill="x")
        self.login_notice = txt(content, "", 10, YELLOW, wraplength=430)
        self.login_notice.pack(pady=12)
        txt(footer, "FZTV AC 2.0 · Авторизация через Supabase", 9, MUTED).pack()

    def login(self):
        email = self.email_field.get().strip()
        password = self.password_field.get()
        if not email or not password:
            self.login_notice.configure(text="Введите почту и пароль")
            return
        self.login_button.configure(state="disabled")
        def job():
            try:
                session = api("POST", "/auth/v1/token?grant_type=password",
                              {"email": email, "password": password})
                with self.token_lock:
                    self.uid = session["user"]["id"]
                    self.email = session["user"].get("email", email)
                    self.access = session["access_token"]
                    self.refresh = session["refresh_token"]
                    self.expiry = time.time() + int(session.get("expires_in", 3600))
                self.ui(self.show_dashboard)
            except Exception as exc:
                self.ui(lambda msg=str(exc): self.login_notice.configure(text="Ошибка входа: " + msg))
            finally:
                self.ui(lambda: self.login_button.configure(state="normal")
                        if self.login_button.winfo_exists() else None)
        self.worker(job)

    def dashboard_row(self, panel, title):
        row = tk.Frame(panel, bg=CARD)
        row.pack(fill="x", pady=5)
        txt(row, title, 10, "#D0D8E4", bg=CARD).pack(side="left")
        status = txt(row, "ОЖИДАНИЕ", 9, MUTED, True, bg=CARD)
        status.pack(side="right")
        return status

    def show_dashboard(self):
        content, footer = self.shell("SECURITY CENTER  /  CLIENT VERSION 2.0")
        # Fixed footer prevents the action button disappearing on maximise.
        self.main_button = action(footer, "ВКЛЮЧИТЬ АНТИЧИТ", self.toggle)
        self.main_button.pack(fill="x", pady=(0, 9))
        self.footer_notice = txt(footer, self.email + "   •   Windows 10/11", 9, MUTED)
        self.footer_notice.pack(side="left")
        action(footer, "ВЫЙТИ", self.logout, bg=FIELD).pack(side="right")
        summary = tk.Frame(content, bg=BG)
        summary.pack(fill="x", pady=(18, 16))
        txt(summary, "FZTV SECURITY", 11, RED, True).pack()
        txt(summary, "ЗАЩИТИ СВОЙ МАТЧ", 20, WHITE, True).pack(pady=(7, 3))
        self.headline = txt(summary, "● АНТИЧИТ ВЫКЛЮЧЕН", 11, RED, True)
        self.headline.pack(pady=(5, 0))
        panel = tk.Frame(content, bg=CARD, padx=16, pady=13,
                         highlightbackground=LINE, highlightthickness=1)
        panel.pack(fill="x")
        txt(panel, "ПРОВЕРКИ СИСТЕМЫ", 10, WHITE, True, bg=CARD).pack(anchor="w", pady=(0, 8))
        self.client_label = self.dashboard_row(panel, "Клиент FZTV")
        self.network_label = self.dashboard_row(panel, "Связь с FZTV")
        self.process_label = self.dashboard_row(panel, "Проверка процессов")
        self.integrity_label = self.dashboard_row(panel, "Целостность CS2")
        self.cs2_label = self.dashboard_row(panel, "Counter-Strike 2")
        txt(content, "ПРЕДУПРЕЖДЕНИЯ / СОБЫТИЯ", 10, WHITE, True).pack(anchor="w", pady=(20, 8))
        events_frame = tk.Frame(content, bg=CARD, padx=12, pady=9,
                                highlightthickness=1, highlightbackground=LINE)
        events_frame.pack(fill="both", expand=True, pady=(0, 8))
        self.event_list = tk.Listbox(events_frame, bg=CARD, fg="#CDD5E0",
                                      font=("Segoe UI", 9), relief="flat", borderwidth=0,
                                      highlightthickness=0, selectbackground=FIELD,
                                      activestyle="none", height=5)
        self.event_list.pack(fill="both", expand=True)
        self.event_list.insert("end", "События появятся после запуска проверок")
        self.refresh_display()

    @staticmethod
    def set_badge(widget, text, color=MUTED):
        widget.configure(text=text, fg=color)

    def refresh_display(self):
        if not hasattr(self, "headline") or not self.headline.winfo_exists():
            return
        self.set_badge(self.headline, "● НА СВЯЗИ" if self.active and self.connected else
                       "● ПОДКЛЮЧЕНИЕ..." if self.active else "● АНТИЧИТ ВЫКЛЮЧЕН",
                       GREEN if self.active and self.connected else YELLOW if self.active else RED)
        self.main_button.configure(text="ОТКЛЮЧИТЬ АНТИЧИТ" if self.active else "ВКЛЮЧИТЬ АНТИЧИТ")
        self.set_badge(self.client_label, "ЗАПУЩЕН" if self.active else "ОЖИДАНИЕ",
                       GREEN if self.active else MUTED)
        self.set_badge(self.network_label, "НА СВЯЗИ" if self.connected else
                       "НЕТ СВЯЗИ" if self.active else "ОЖИДАНИЕ",
                       GREEN if self.connected else YELLOW if self.active else MUTED)
        self.set_badge(self.process_label, self.status["process"])
        self.set_badge(self.integrity_label, self.status["integrity"])
        self.set_badge(self.cs2_label, self.status["cs2"], GREEN if self.status["cs2"] == "ЗАПУЩЕНА" else MUTED)

    def add_event(self, severity, title):
        if not self.closing and hasattr(self, "event_list") and self.event_list.winfo_exists():
            self.event_list.insert(0, time.strftime("%H:%M:%S") + "  [" + severity.upper() + "] " + title)
            while self.event_list.size() > 60:
                self.event_list.delete("end")

    def token(self):
        with self.token_lock:
            if self.access and self.expiry > time.time() + 120:
                return self.access
            refresh = self.refresh
        if not refresh:
            raise RuntimeError("Выполните вход повторно")
        info = api("POST", "/auth/v1/token?grant_type=refresh_token",
                   {"refresh_token": refresh})
        with self.token_lock:
            self.access = info["access_token"]
            self.refresh = info["refresh_token"]
            self.expiry = time.time() + int(info.get("expires_in", 3600))
            return self.access

    def send_event(self, kind, severity, title, details=""):
        signature = kind + "|" + title + "|" + details
        if signature in self.seen_events:
            return
        api("POST", "/rest/v1/fztv_ac_events",
            [{"user_id": self.uid, "event_type": kind, "severity": severity,
              "title": title, "details": details[:500]}],
            self.token(), "return=minimal")
        self.seen_events.add(signature)
        self.ui(lambda: self.add_event(severity, title))

    def scan(self):
        reviews, executable = scan_processes()
        process_result = "ВНИМАНИЕ" if reviews else "ГОТОВО"
        integrity = "НЕ ПРОВЕРЕНО"
        game_running = bool(executable)
        game_hash = None
        warning = "medium" if reviews else "none"
        if reviews:
            for name in reviews:
                self.send_event("diagnostic_process", "medium",
                                "Найден диагностический процесс: " + name,
                                "Совпадение имени процесса; не является доказательством нарушения")
        if executable:
            try:
                game_hash = sha256_file(executable)
                result = local_baseline(executable, game_hash)
                if result == "changed":
                    integrity = "ИЗМЕНЁН ФАЙЛ"
                    warning = "medium"
                    self.send_event("exe_hash_changed", "medium",
                                    "Изменился SHA-256 cs2.exe",
                                    "Возможна обычная переустановка или обновление игры")
                else:
                    integrity = "ЭТАЛОН СОЗДАН" if result == "baseline_created" else "БЕЗ ИЗМЕНЕНИЙ"
            except (OSError, ValueError) as exc:
                integrity = "НЕТ ДОСТУПА"
                self.send_event("integrity_unavailable", "low", "Проверка файла CS2 недоступна",
                                "Ошибка чтения файла или локального эталона")
        return {"process_check": "review" if reviews else "ok",
                "integrity_check": integrity, "warning_level": warning,
                "last_cs2_hash": game_hash, "cs2_running": game_running,
                "process_label": process_result}

    def heartbeat(self, running, result=None):
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        payload = {"user_id": self.uid, "client_version": VERSION,
                   "platform": windows_version(), "running": running,
                   "cs2_running": bool(result and result["cs2_running"]) if running else False,
                   "last_seen": timestamp, "updated_at": timestamp,
                   "last_scan_at": timestamp if running else None,
                   "process_check": result["process_check"] if running and result else "not_checked",
                   "integrity_check": result["integrity_check"] if running and result else "not_checked",
                   "warning_level": result["warning_level"] if running and result else "none",
                   "warning_count": len(self.seen_events)}
        if running and result:
            payload["last_cs2_hash"] = result["last_cs2_hash"]
        api("POST", "/rest/v1/fztv_ac_status?on_conflict=user_id",
            [payload], self.token(), "resolution=merge-duplicates,return=minimal")

    def apply_scan(self, data):
        if not self.active or self.closing:
            return
        self.connected = True
        self.status["process"] = data["process_label"]
        self.status["integrity"] = data["integrity_check"]
        self.status["cs2"] = "ЗАПУЩЕНА" if data["cs2_running"] else "НЕ ЗАПУЩЕНА"
        self.refresh_display()

    def toggle(self):
        if self.active:
            self.active = False
            self.generation += 1
            self.connected = False
            self.refresh_display()
            self.worker(self.stop_signal)
        else:
            self.active = True
            self.generation += 1
            current = self.generation
            self.refresh_display()
            self.worker(lambda: self.loop(current))

    def loop(self, generation):
        while self.active and generation == self.generation and not self.closing:
            try:
                result = self.scan()
                if not self.active or generation != self.generation:
                    break
                self.heartbeat(True, result)
                self.ui(lambda data=result: self.apply_scan(data))
            except Exception as exc:
                self.ui(lambda msg=str(exc): self.connection_error(msg))
            for _ in range(INTERVAL * 2):
                if not self.active or self.closing or generation != self.generation:
                    return
                time.sleep(.5)

    def connection_error(self, message):
        if not self.active:
            return
        self.connected = False
        self.refresh_display()
        self.add_event("low", "Нет связи: " + message[:70])

    def stop_signal(self):
        try:
            self.heartbeat(False)
        except Exception:
            pass

    def logout(self):
        self.active = False
        self.generation += 1
        self.worker(self.stop_signal)
        self.connected = False
        # Never persist access tokens or password on disk.
        self.show_login()
        with self.token_lock:
            self.uid = None
            self.email = ""
            self.access = None
            self.refresh = None
            self.expiry = 0

    def close(self):
        was_active = self.active
        self.active = False
        self.closing = True
        if was_active:
            self.worker(self.stop_signal)
        self.root.destroy()


if __name__ == "__main__":
    main = tk.Tk()
    Window(main)
    main.mainloop()
