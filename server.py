import os
from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
import sqlite3

app = Flask(__name__)
app.secret_key = os.urandom(24)

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            ip TEXT,
            online TEXT,
            status TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            date TEXT,
            text TEXT
        )
    ''')
    cursor.execute('SELECT COUNT(*) FROM servers')
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO servers (name, ip, online, status) VALUES ('RED RP', 'play.goodmobile.su:7777', '0 / 100', 'В разработке')")
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM servers')
    servers = cursor.fetchall()
    cursor.execute('SELECT * FROM news ORDER BY id DESC')
    news = cursor.fetchall()
    conn.close()
    return render_template('index.html', servers=servers, news=news)

@app.route('/download')
def download_apk():
    return send_from_directory(directory='.', path='launcher.apk', as_attachment=True)

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if not session.get('logged_in'):
        if request.method == 'POST':
            if request.form.get('password') == 'admin123':
                session['logged_in'] = True
                return redirect(url_for('admin'))
            return render_template('admin.html', error='Неверный пароль', login=True)
        return render_template('admin.html', login=True)
    
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add_server':
            name = request.form.get('name')
            ip = request.form.get('ip')
            online = request.form.get('online')
            status = request.form.get('status')
            cursor.execute('INSERT INTO servers (name, ip, online, status) VALUES (?, ?, ?, ?)', (name, ip, online, status))
            conn.commit()
        elif action == 'delete_server':
            s_id = request.form.get('id')
            cursor.execute('DELETE FROM servers WHERE id = ?', (s_id,))
            conn.commit()
        elif action == 'add_news':
            title = request.form.get('title')
            date = request.form.get('date')
            text = request.form.get('text')
            cursor.execute('INSERT INTO news (title, date, text) VALUES (?, ?, ?)', (title, date, text))
            conn.commit()
        elif action == 'delete_news':
            n_id = request.form.get('id')
            cursor.execute('DELETE FROM news WHERE id = ?', (n_id,))
            conn.commit()

    cursor.execute('SELECT * FROM servers')
    servers = cursor.fetchall()
    cursor.execute('SELECT * FROM news')
    news = cursor.fetchall()
    conn.close()
    
    return render_template('admin.html', servers=servers, news=news, logged_in=True)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
