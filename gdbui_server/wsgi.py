from gevent import monkey
monkey.patch_all(subprocess=False, select=False, os=False)

from gdbui_server.main import app, socketio

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=10000)
