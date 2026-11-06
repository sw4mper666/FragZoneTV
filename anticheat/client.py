"""FZTV Anti-Cheat 1.0 desktop launcher.

Windows 10/11. This client reports presence and whether CS2 is running.
It is not a cheat detection engine or an integrity attestation service.
"""
import json
import platform
import threading
import time
import urllib.error
import urllib.request
import tkinter as tk
from tkinter import messagebox

import psutil

API = "https://svcbxbovsjslfduogjyt.supabase.co"
PUBLIC_KEY = "sb_publishable_5y0mlwG1w-DVMjmMIphMhw_DpZ7fZaB"
VERSION = "1.0"
INTERVAL = 20

BG = "#0A0E15"
PANEL = "#131A24"
PANEL_2 = "#1A2330"
STROKE = "#283343"
WHITE = "#F4F6FA"
MUTED = "#8F9DB1"
RED = "#E33646"
RED_DARK = "#8B2531"
GREEN = "#39C987"
AMBER = "#E7A050"


class ApiError(Exception):
    pass


def request(method, path, body=None, token=None, prefer=None):
    headers = {"apikey": PUBLIC_KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if prefer:
        headers["Prefer"] = prefer
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as exc:
        try:
            error = json.loads(exc.read().decode("utf-8"))
            detail = error.get("msg") or error.get("message") or error.get("error_description")
        except Exception:
            detail = "HTTP " + str(exc.code)
        raise ApiError(detail or "Request failed") from None
    except (urllib.error.URLError, TimeoutError) as exc:
        raise ApiError("Нет связи с сервером: " + str(exc)) from None


def cs2_is_running():
    try:
        return any((p.info.get("name") or "").lower() == "cs2.exe"
                   for p in psutil.process_iter(["name"]))
    except (psutil.Error, OSError):
        return False


def windows_name():
    try:
        build = int(platform.version().split(".")[-1])
    except (ValueError, IndexError):
        build = 0
    return "Windows 11" if platform.release() == "11" or build >= 22000 else "Windows 10"


def label(parent, text, size=10, color=WHITE, bold=False, bg=BG, **kwargs):
    return tk.Label(parent, text=text, font=("Segoe UI", size, "bold" if bold else "normal"),
                    fg=color, bg=bg, **kwargs)


def button(parent, text, command, background=RED, foreground=WHITE, **kwargs):
    return tk.Button(parent, text=text, command=command, font=("Segoe UI", 10, "bold"),
                     bg=background, fg=foreground, activebackground=RED_DARK,
                     activeforeground=WHITE, relief="flat", borderwidth=0,
                     cursor="hand2", highlightthickness=0, **kwargs)


class Launcher:
    def __init__(self, root):
        self.root = root
        self.root.title("FZTV Anti-Cheat 1.0")
        self.root.geometry("460x660")
        self.root.minsize(440, 640)
        self.root.configure(bg=BG)
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.email = ""
        self.expires_at = 0
        self.active = False
        self.connected = False
        self.cs2_running = False
        self.closing = False
        self.lock = threading.Lock()
        self.show_login()

    def thread(self, callback):
        threading.Thread(target=callback, daemon=True).start()

    def ui(self, callback):
        if not self.closing:
            try:
                self.root.after(0, callback)
            except RuntimeError:
                pass

    def clear(self):
        for child in self.root.winfo_children():
            child.destroy()

    def shell(self, eyebrow):
        self.clear()
        page = tk.Frame(self.root, bg=BG, padx=30, pady=22)
        page.pack(fill="both", expand=True)
        top = tk.Frame(page, bg=BG)
        top.pack(fill="x")
        logo = tk.Frame(top, bg=BG)
        logo.pack(anchor="w")
        label(logo, "FZTV ", 19, WHITE, True).pack(side="left")
        label(logo, "ANTI-CHEAT", 19, RED, True).pack(side="left")
        label(page, eyebrow, 9, MUTED).pack(anchor="w", pady=(0, 17))
        tk.Frame(page, height=1, bg=STROKE).pack(fill="x")
        return page

    @staticmethod
    def shield(canvas, center_x, center_y, scale=1, color=RED):
        x, y, s = center_x, center_y, scale
        outline = [(-19,-25),(0,-33),(19,-25),(19,-2),(14,16),(0,28),(-14,16),(-19,-2)]
        pts = []
        for a, b in outline:
            pts.extend((x+a*s, y+b*s))
        canvas.create_polygon(pts, fill=PANEL, outline=color, width=max(2, int(2.4*s)),
                              smooth=False)
        canvas.create_line(x-9*s, y-1*s, x-2*s, y+8*s, x+11*s, y-11*s,
                           fill=color, width=max(2, int(3*s)), capstyle="round",
                           joinstyle="round")

    def show_login(self):
        page = self.shell("SECURE PLAYER AUTHENTICATION  /  WINDOWS 10–11")
        art = tk.Canvas(page, width=132, height=118, bg=BG, highlightthickness=0)
        art.pack(pady=(25, 1))
        art.create_oval(25, 14, 107, 96, outline="#45232E", width=2)
        art.create_oval(36, 25, 96, 85, outline=RED_DARK, width=1)
        self.shield(art, 66, 56, 0.85)
        label(page, "Вход в FZTV Anti-Cheat", 17, WHITE, True).pack(pady=(0, 4))
        label(page, "Используй свой аккаунт FragZoneTV", 10, MUTED).pack(pady=(0, 24))
        label(page, "ЭЛЕКТРОННАЯ ПОЧТА", 9, MUTED, True).pack(anchor="w", pady=(0, 6))
        self.login_entry = tk.Entry(page, font=("Segoe UI", 11), bg=PANEL_2, fg=WHITE,
                                    insertbackground=WHITE, relief="flat", bd=0)
        self.login_entry.pack(fill="x", ipady=12, pady=(0, 17))
        label(page, "ПАРОЛЬ", 9, MUTED, True).pack(anchor="w", pady=(0, 6))
        self.password_entry = tk.Entry(page, show="•", font=("Segoe UI", 11), bg=PANEL_2,
                                       fg=WHITE, insertbackground=WHITE, relief="flat", bd=0)
        self.password_entry.pack(fill="x", ipady=12)
        self.show_password = tk.BooleanVar(value=False)
        tk.Checkbutton(page, text="Показать пароль", variable=self.show_password,
                       command=lambda: self.password_entry.config(
                           show="" if self.show_password.get() else "•"),
                       bg=BG, fg=MUTED, selectcolor=PANEL, activebackground=BG,
                       activeforeground=WHITE, font=("Segoe UI", 9),
                       highlightthickness=0, bd=0).pack(anchor="w", pady=(9, 15))
        self.login_button = button(page, "ВОЙТИ В АНТИЧИТ", self.sign_in)
        self.login_button.pack(fill="x", ipady=12)
        self.login_feedback = label(page, "", 10, AMBER, wraplength=380)
        self.login_feedback.pack(pady=(15, 0))
        label(page, "Единый аккаунт FZTV  •  Версия 1.0", 9, MUTED).pack(side="bottom", pady=(10, 3))

    def sign_in(self):
        email = self.login_entry.get().strip()
        password = self.password_entry.get()
        if not email or not password:
            self.login_feedback.config(text="Введите электронную почту и пароль.")
            return
        self.login_button.config(state="disabled", text="ПОДКЛЮЧЕНИЕ…")
        self.login_feedback.config(text="")
        def job():
            try:
                auth = request("POST", "/auth/v1/token?grant_type=password",
                               {"email": email, "password": password})
                with self.lock:
                    self.user_id = auth["user"]["id"]
                    self.email = auth["user"].get("email", email)
                    self.access_token = auth["access_token"]
                    self.refresh_token = auth["refresh_token"]
                    self.expires_at = time.time() + int(auth.get("expires_in", 3600))
                self.ui(self.show_dashboard)
            except Exception as exc:
                self.ui(lambda msg=str(exc): self.login_feedback.config(text="Ошибка входа: " + msg))
            finally:
                self.ui(lambda: self.login_button.config(state="normal", text="ВОЙТИ В АНТИЧИТ")
                        if self.login_button.winfo_exists() else None)
        self.thread(job)

    def status_line(self, parent, name):
        row = tk.Frame(parent, bg=PANEL)
        row.pack(fill="x", pady=8)
        label(row, name, 10, "#BBC6D6", bg=PANEL).pack(side="left")
        value = label(row, "ОЖИДАНИЕ", 9, MUTED, True, PANEL)
        value.pack(side="right")
        return value

    def show_dashboard(self):
        page = self.shell("PLAYER CONTROL CENTER  /  FZTV AC 1.0")
        art = tk.Canvas(page, height=230, bg=BG, highlightthickness=0)
        art.pack(fill="x", pady=(9, 0))
        self.indicator = art
        self.draw_indicator()
        self.title = label(page, "Защити свой матч", 18, WHITE, True)
        self.title.pack(pady=(1, 3))
        self.subtitle = label(page, "Клиент ожидает запуска", 10, MUTED)
        self.subtitle.pack(pady=(0, 12))
        self.status_pill = label(page, "● ОТКЛЮЧЁН", 10, RED, True)
        self.status_pill.pack(pady=(0, 15))
        card = tk.Frame(page, bg=PANEL, padx=18, pady=12, highlightbackground=STROKE,
                        highlightthickness=1)
        card.pack(fill="x", pady=(0, 16))
        label(card, "СИСТЕМА", 10, WHITE, True, PANEL).pack(anchor="w", pady=(0, 5))
        self.check_client = self.status_line(card, "Клиент FZTV")
        self.check_connection = self.status_line(card, "Соединение с сервером")
        self.check_cs2 = self.status_line(card, "Counter-Strike 2")
        self.check_match = self.status_line(card, "Статус матча")
        self.action = button(page, "ВКЛЮЧИТЬ КЛИЕНТ", self.toggle)
        self.action.pack(fill="x", ipady=11)
        self.message = label(page, "", 9, MUTED, wraplength=390)
        self.message.pack(pady=(11, 0))
        footer = tk.Frame(page, bg=BG)
        footer.pack(side="bottom", fill="x", pady=(9, 0))
        label(footer, self.email, 9, MUTED).pack(side="left")
        button(footer, "ВЫЙТИ", self.sign_out, background=PANEL_2,
               padx=13, pady=5).pack(side="right")
        self.refresh_screen()

    def draw_indicator(self):
        canvas = self.indicator
        canvas.delete("all")
        width = canvas.winfo_width() if canvas.winfo_width() > 10 else 400
        cx, cy = width / 2, 115
        color = GREEN if self.active and self.connected else AMBER if self.active else RED
        canvas.create_oval(cx-91, cy-91, cx+91, cy+91, outline=STROKE, width=13)
        if self.active and self.connected:
            canvas.create_arc(cx-91, cy-91, cx+91, cy+91, start=90,
                              extent=359, outline=color, style="arc", width=12)
        else:
            canvas.create_arc(cx-91, cy-91, cx+91, cy+91, start=90,
                              extent=110 if self.active else 65, outline=color,
                              style="arc", width=12)
        canvas.create_oval(cx-73, cy-73, cx+73, cy+73, fill=PANEL, outline=PANEL_2, width=2)
        self.shield(canvas, cx, cy-16, 0.95, color)
        canvas.create_text(cx, cy+47, text="ON" if self.active and self.connected else
                           "..." if self.active else "OFF",
                           fill=color, font=("Segoe UI", 19, "bold"))
        canvas.create_text(cx, cy+67, text="FZTV AC 1.0", fill=MUTED,
                           font=("Segoe UI", 8, "bold"))

    @staticmethod
    def set_status(widget, status, color):
        widget.config(text=status, fg=color)

    def refresh_screen(self):
        if not hasattr(self, "indicator") or not self.indicator.winfo_exists():
            return
        self.draw_indicator()
        if not self.active:
            self.status_pill.config(text="● КЛИЕНТ ВЫКЛЮЧЕН", fg=RED)
            self.subtitle.config(text="Нажми кнопку, чтобы подключиться")
            self.action.config(text="ВКЛЮЧИТЬ КЛИЕНТ", bg=RED, state="normal")
        elif self.connected:
            self.status_pill.config(text="● КЛИЕНТ ПОДКЛЮЧЁН", fg=GREEN)
            self.subtitle.config(text="Сеанс активен • соединение установлено")
            self.action.config(text="ОТКЛЮЧИТЬ КЛИЕНТ", bg=RED_DARK, state="normal")
        else:
            self.status_pill.config(text="● ПОДКЛЮЧЕНИЕ…", fg=AMBER)
            self.subtitle.config(text="Ожидание ответа сервера")
            self.action.config(text="ОТКЛЮЧИТЬ КЛИЕНТ", bg=RED_DARK, state="normal")
        self.set_status(self.check_client, "ЗАПУЩЕН" if self.active else "ОЖИДАНИЕ",
                        GREEN if self.active else MUTED)
        self.set_status(self.check_connection, "НА СВЯЗИ" if self.connected else
                        "НЕТ СВЯЗИ" if self.active else "ОЖИДАНИЕ",
                        GREEN if self.connected else AMBER if self.active else MUTED)
        self.set_status(self.check_cs2, "ЗАПУЩЕНА" if self.cs2_running and self.connected else
                        "НЕ ЗАПУЩЕНА", GREEN if self.cs2_running and self.connected else MUTED)
        self.set_status(self.check_match, "НЕ ПОДТВЕРЖДЁН", AMBER)
        # No match verification or cheat-detection engine is present in v1.0.
        self.message.config(text="Статус клиента и запуск CS2 отображаются в админ-панели.")

    def token(self):
        with self.lock:
            if self.access_token and self.expires_at > time.time() + 120:
                return self.access_token
            refresh = self.refresh_token
        if not refresh:
            raise ApiError("Сессия завершена. Выполните вход повторно.")
        auth = request("POST", "/auth/v1/token?grant_type=refresh_token",
                       {"refresh_token": refresh})
        with self.lock:
            self.access_token = auth["access_token"]
            self.refresh_token = auth["refresh_token"]
            self.expires_at = time.time() + int(auth.get("expires_in", 3600))
            return self.access_token

    def heartbeat(self, running):
        token = self.token()
        game = cs2_is_running() if running else False
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        record = {
            "user_id": self.user_id,
            "client_version": VERSION,
            "platform": windows_name(),
            "running": running,
            "cs2_running": game,
            "last_seen": timestamp,
            "updated_at": timestamp,
        }
        request("POST", "/rest/v1/fztv_ac_status?on_conflict=user_id",
                [record], token, "resolution=merge-duplicates,return=minimal")
        return game

    def toggle(self):
        if self.active:
            self.active = False
            self.connected = False
            self.cs2_running = False
            self.refresh_screen()
            self.thread(self.stop_signal)
        else:
            self.active = True
            self.connected = False
            self.refresh_screen()
            self.thread(self.loop)

    def loop(self):
        while self.active and not self.closing:
            try:
                game = self.heartbeat(True)
                self.ui(lambda running=game: self.update_connection(True, running))
            except Exception as exc:
                self.ui(lambda msg=str(exc): self.update_connection(False, False, msg))
            for _ in range(INTERVAL * 2):
                if not self.active or self.closing:
                    return
                time.sleep(0.5)

    def update_connection(self, ok, game, error=""):
        if not self.active or self.closing:
            return
        self.connected = ok
        self.cs2_running = game
        self.refresh_screen()
        if error:
            self.message.config(text=error, fg=AMBER)
        else:
            self.message.config(fg=MUTED)

    def stop_signal(self):
        try:
            self.heartbeat(False)
        except Exception:
            pass

    def sign_out(self):
        if self.active:
            self.active = False
            self.thread(self.stop_signal)
        self.connected = False
        self.cs2_running = False
        with self.lock:
            self.access_token = None
            self.refresh_token = None
            self.user_id = None
            self.email = ""
            self.expires_at = 0
        self.show_login()

    def close(self):
        was_active = self.active
        self.active = False
        self.closing = True
        if was_active:
            self.thread(self.stop_signal)
        self.root.destroy()


if __name__ == "__main__":
    app_root = tk.Tk()
    Launcher(app_root)
    app_root.mainloop()
