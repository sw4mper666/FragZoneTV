"""FZTV Anti-Cheat 1.0 — Windows client presence monitor for CS2.

This version reports client presence and whether cs2.exe is running.
It does NOT detect cheats or attest client integrity.
"""
import json
import os
import platform
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import tkinter as tk
from tkinter import ttk, messagebox

import psutil

API = "https://svcbxbovsjslfduogjyt.supabase.co"
PUBLIC_KEY = "sb_publishable_5y0mlwG1w-DVMjmMIphMhw_DpZ7fZaB"
VERSION = "1.0"
INTERVAL = 20


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
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        try:
            error = json.loads(exc.read().decode("utf-8"))
            detail = error.get("msg") or error.get("message") or error.get("error_description")
        except Exception:
            detail = "HTTP " + str(exc.code)
        raise ApiError(detail or "Request failed") from None
    except (urllib.error.URLError, TimeoutError) as exc:
        raise ApiError("Ошибка соединения: " + str(exc)) from None


def cs2_is_running():
    try:
        return any((p.info.get("name") or "").lower() in ("cs2.exe", "cs2") for p in psutil.process_iter(["name"]))
    except (psutil.Error, OSError):
        return False


class Client:
    def __init__(self, root):
        self.root = root
        self.root.title("FZTV Anti-Cheat 1.0")
        self.root.geometry("430x345")
        self.root.configure(bg="#101720")
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.email = None
        self.expires_at = 0
        self.active = False
        self.closing = False
        self.lock = threading.Lock()
        self.state = tk.StringVar(value="Не выполнен вход")
        self.game_state = tk.StringVar(value="CS2: не проверено")

        tk.Label(root, text="FZTV Anti-Cheat 1.0", font=("Segoe UI", 21, "bold"),
                 bg="#101720", fg="#f1f4f8").pack(pady=(18, 3))
        tk.Label(root, text="Windows 10/11  •  Counter-Strike 2", bg="#101720", fg="#90a3bc").pack()
        pane = tk.Frame(root, bg="#101720")
        pane.pack(pady=17)
        tk.Label(pane, text="Email FragZoneTV", bg="#101720", fg="white").pack(anchor="w")
        self.login = ttk.Entry(pane, width=42)
        self.login.pack(pady=(3, 11))
        tk.Label(pane, text="Пароль", bg="#101720", fg="white").pack(anchor="w")
        self.password = ttk.Entry(pane, width=42, show="•")
        self.password.pack(pady=(3, 11))
        self.signin = ttk.Button(pane, text="Войти", command=self.do_login)
        self.signin.pack(fill="x", pady=3)
        self.toggle = ttk.Button(pane, text="Запустить клиент", command=self.toggle_client, state="disabled")
        self.toggle.pack(fill="x", pady=5)
        tk.Label(root, textvariable=self.state, bg="#101720", fg="#70d6a7").pack(pady=(3, 2))
        tk.Label(root, textvariable=self.game_state, bg="#101720", fg="#aac5ed").pack()
        tk.Label(root, text="Клиент сообщает статус. Проверка читов пока не реализована.",
                 bg="#101720", fg="#9babbf", font=("Segoe UI", 8)).pack(pady=8)
        root.protocol("WM_DELETE_WINDOW", self.on_close)

    def async_run(self, task):
        threading.Thread(target=task, daemon=True).start()

    def ui(self, callback):
        if not self.closing:
            self.root.after(0, callback)

    def do_login(self):
        email, password = self.login.get().strip(), self.password.get()
        if not email or not password:
            messagebox.showwarning("Вход", "Введите email и пароль.")
            return
        self.signin.configure(state="disabled")
        self.state.set("Авторизация...")
        def worker():
            try:
                auth = request("POST", "/auth/v1/token?grant_type=password", {"email": email, "password": password})
                user = auth["user"]
                with self.lock:
                    self.user_id = user["id"]
                    self.email = user.get("email", email)
                    self.access_token = auth["access_token"]
                    self.refresh_token = auth["refresh_token"]
                    self.expires_at = time.time() + int(auth.get("expires_in", 3600))
                self.ui(lambda: (self.password.delete(0, "end"), self.toggle.configure(state="normal"),
                                 self.state.set("Вход выполнен: " + self.email)))
            except Exception as exc:
                self.ui(lambda error=str(exc): self.state.set("Ошибка входа: " + error))
            finally:
                self.ui(lambda: self.signin.configure(state="normal"))
        self.async_run(worker)

    def token(self):
        with self.lock:
            if self.expires_at > time.time() + 120:
                return self.access_token
            refresh = self.refresh_token
        result = request("POST", "/auth/v1/token?grant_type=refresh_token", {"refresh_token": refresh})
        with self.lock:
            self.access_token = result["access_token"]
            self.refresh_token = result["refresh_token"]
            self.expires_at = time.time() + int(result.get("expires_in", 3600))
            return self.access_token

    def heartbeat(self, running):
        token = self.token()
        data = {
            "user_id": self.user_id,
            "client_version": VERSION,
            "platform": "Windows 11" if platform.release() == "11" or
                        (platform.release() == "10" and int(platform.version().split(".")[-1]) >= 22000)
                        else "Windows 10",
            "running": running,
            "cs2_running": cs2_is_running() if running else False,
            "last_seen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        request("POST", "/rest/v1/fztv_ac_status?on_conflict=user_id", [data], token,
                "resolution=merge-duplicates,return=minimal")
        return data["cs2_running"]

    def toggle_client(self):
        if not self.user_id:
            return
        if self.active:
            self.active = False
            self.toggle.configure(state="disabled")
            self.state.set("Остановка...")
            def stop():
                try:
                    self.heartbeat(False)
                    self.ui(lambda: self.state.set("Клиент выключен"))
                except Exception as exc:
                    self.ui(lambda error=str(exc): self.state.set("Нет подтверждения остановки: " + error))
                finally:
                    self.ui(lambda: self.toggle.configure(state="normal", text="Запустить клиент"))
            self.async_run(stop)
        else:
            self.active = True
            self.toggle.configure(text="Остановить клиент")
            self.state.set("Подключение...")
            self.async_run(self.run_loop)

    def run_loop(self):
        while self.active and not self.closing:
            try:
                game = self.heartbeat(True)
                self.ui(lambda game=game: (self.state.set("Клиент подключён • FZTV AC 1.0"),
                                           self.game_state.set("CS2: запущена" if game else "CS2: не запущена")))
            except Exception as exc:
                self.ui(lambda error=str(exc): self.state.set("Нет соединения: " + error))
            for _ in range(INTERVAL * 2):
                if not self.active or self.closing:
                    break
                time.sleep(.5)

    def on_close(self):
        self.active = False
        self.closing = True
        # A lost heartbeat also automatically makes the server-side status offline.
        self.root.destroy()


if __name__ == "__main__":
    window = tk.Tk()
    Client(window)
    window.mainloop()
