from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import sys
import certifi

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    'port': 4000,
    'user': '7K32KMo73avb5Nw.root',
    'password': 'ekUSA1GHCxNMHodL',
    'database': 'StoreMusicale4',
    'ssl_ca': certifi.where()
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# 1. POST /api/login
@app.route('/api/login', methods=['POST'])
def login():
    try:
        dati = request.json
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username FROM utenti WHERE email = %s AND password = %s", (dati.get('email'), dati.get('password')))
        utente = cursor.fetchone()
        cursor.close()
        conn.close()
        if utente:
            return jsonify(utente), 200
        return jsonify({'error': 'Credenziali errate'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 2. POST /api/register
@app.route('/api/register', methods=['POST'])
def register():
    try:
        dati = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO utenti (username, email, password) VALUES (%s, %s, %s)", (dati.get('username'), dati.get('email'), dati.get('password')))
        conn.commit()
        nuovo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'id': nuovo_id, 'message': 'Registrato'}), 201
    except Exception as err:
        return jsonify({'error': str(err)}), 400

# 3. GET /api/albums
@app.route('/api/albums', methods=['GET'])
def get_albums():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT a.id, a.titolo, a.copertina, a.artista_id as artistaId, art.nome as nomeArtista FROM albums a JOIN artisti art ON a.artista_id = art.id")
        albums = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(albums), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 4. GET /api/albums/<id> (CORRETTO: Aggiunto art.foto as fotoArtista)
@app.route('/api/albums/<int:album_id>', methods=['GET'])
def get_album_dettaglio(album_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # QUI LA CORREZIONE: Estraiamo art.foto per passarlo ad Angular
        cursor.execute("SELECT a.id, a.titolo, a.copertina, a.artista_id as artistaId, art.nome as nomeArtista, art.foto as fotoArtista FROM albums a JOIN artisti art ON a.artista_id = art.id WHERE a.id = %s", (album_id,))
        album = cursor.fetchone()
        if not album:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Album non trovato'}), 404
        
        cursor.execute("SELECT id, titolo, durata FROM canzoni WHERE album_id = %s", (album_id,))
        album['canzoni'] = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(album), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 5. GET /api/artisti/<id>
@app.route('/api/artisti/<int:artista_id>', methods=['GET'])
def get_artista_dettaglio(artista_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nome, foto FROM artisti WHERE id = %s", (artista_id,))
        artista = cursor.fetchone()
        if not artista:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Artista non trovato'}), 404
        
        cursor.execute("SELECT id, titolo, copertina FROM albums WHERE artista_id = %s", (artista_id,))
        artista['albums'] = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(artista), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 6. GET /api/playlists
@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    try:
        utente_id = request.args.get('utenteId')
        if not utente_id:
            return jsonify({'error': 'Parametro utenteId mancante'}), 400
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nome FROM playlists WHERE utente_id = %s", (utente_id,))
        playlists = cursor.fetchall()
        
        for p in playlists:
            query_c = """
                SELECT c.id, c.titolo, art.nome as artista 
                FROM playlist_canzoni pc 
                JOIN canzoni c ON pc.canzone_id = c.id 
                JOIN albums alb ON c.album_id = alb.id
                JOIN artisti art ON alb.artista_id = art.id 
                WHERE pc.playlist_id = %s
            """
            cursor.execute(query_c, (p['id'],))
            p['canzoni'] = cursor.fetchall()
            
        cursor.close()
        conn.close()
        return jsonify(playlists), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 7. POST /api/playlists
@app.route('/api/playlists', methods=['POST'])
def crea_playlist():
    try:
        dati = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO playlists (nome, utente_id) VALUES (%s, %s)", (dati.get('nome'), dati.get('utenteId')))
        conn.commit()
        nuovo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'id': nuovo_id, 'message': 'Playlist creata'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 8. DELETE /api/playlists/<id>
@app.route('/api/playlists/<int:playlist_id>', methods=['DELETE'])
def elimina_playlist(playlist_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM playlist_canzoni WHERE playlist_id = %s", (playlist_id,))
        cursor.execute("DELETE FROM playlists WHERE id = %s", (playlist_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Playlist eliminata'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 9. GET /api/canzoni
@app.route('/api/canzoni', methods=['GET'])
def get_tutte_canzoni():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT c.id, c.titolo, art.nome as artista 
            FROM canzoni c 
            JOIN albums alb ON c.album_id = alb.id
            JOIN artisti art ON alb.artista_id = art.id
        """
        cursor.execute(query)
        canzoni = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(canzoni), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 10. POST /api/playlists/<id>/canzoni
@app.route('/api/playlists/<int:playlist_id>/canzoni', methods=['POST'])
def aggiungi_canzone_playlist(playlist_id):
    try:
        dati = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO playlist_canzoni (playlist_id, canzone_id) VALUES (%s, %s)", (playlist_id, dati.get('canzoneId')))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Canzone aggiunta'}), 201
    except Exception as err:
        return jsonify({'error': str(err)}), 400

# 11. DELETE /api/playlists/<id>/canzoni/<id>
@app.route('/api/playlists/<int:playlist_id>/canzoni/<int:canzone_id>', methods=['DELETE'])
def rimuovi_canzone_playlist(playlist_id, canzone_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM playlist_canzoni WHERE playlist_id = %s AND canzone_id = %s", (playlist_id, canzone_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Canzone rimossa'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
