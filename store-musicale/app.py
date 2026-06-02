from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
# Abilitiamo CORS su tutta l'applicazione per permettere ad Angular di comunicare senza blocchi
CORS(app)

# Configurazione dei parametri di connessione a TiDB Cloud
db_config = {
    'host': 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    'port': 4000,
    'user': '7K32KMo73avb5Nw.root',
    'password': 'ekUSA1GHCxNMHodL',
    'database': 'StoreMusicale4',
    'ssl_ca': '/etc/ssl/cert.pem' # Configurazione SSL obbligatoria per TiDB
}

def get_db_connection():
    """Funzione di utilità per aprire una nuova connessione al database TiDB"""
    return mysql.connector.connect(**db_config)

# ---------------------------------------------------------
# 1. POST /api/login
# ---------------------------------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    """Verifica le credenziali dell'utente ed effettua l'accesso"""
    dati = request.json
    email = dati.get('email')
    password = dati.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = "SELECT id, username FROM utenti WHERE email = %s AND password = %s"
    cursor.execute(query, (email, password))
    utente = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if utente:
        return jsonify(utente), 200
    else:
        return jsonify({'error': 'Email o password errati'}), 401

# ---------------------------------------------------------
# 2. POST /api/register
# ---------------------------------------------------------
@app.route('/api/register', methods=['POST'])
def register():
    """Registra un nuovo utente nel sistema"""
    dati = request.json
    username = dati.get('username')
    email = dati.get('email')
    password = dati.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = "INSERT INTO utenti (username, email, password) VALUES (%s, %s, %s)"
        cursor.execute(query, (username, email, password))
        conn.commit()
        nuovo_id = cursor.lastrowid
        return jsonify({'id': nuevo_id, 'message': 'Utente registrato con successo'}), 201
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# 3. GET /api/albums
# ---------------------------------------------------------
@app.route('/api/albums', methods=['GET'])
def get_albums():
    """Recupera la lista di tutti gli album con il relativo artista associato"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT a.id, a.titolo, a.copertina, a.artista_id as artistaId, art.nome as nomeArtista 
        FROM albums a 
        JOIN artisti art ON a.artista_id = art.id
    """
    cursor.execute(query)
    albums = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(albums), 200

# ---------------------------------------------------------
# 4. GET /api/album/<id>
# ---------------------------------------------------------
@app.route('/api/album/<int:album_id>', methods=['GET'])
def get_album_dettaglio(album_id):
    """Recupera i dettagli di un album specifico e la lista delle sue canzoni"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Recupera informazioni principali dell'album e dell'artista
    query_album = """
        SELECT a.id, a.titolo, a.copertina, a.artista_id as artistaId, art.nome as nomeArtista, art.foto as fotoArtista
        FROM albums a
        JOIN artisti art ON a.artista_id = art.id
        WHERE a.id = %s
    """
    cursor.execute(query_album, (album_id,))
    album = cursor.fetchone()
    
    if not album:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Album non trovato'}), 404
        
    # 2. Recupera le canzoni collegate all'album
    query_canzoni = "SELECT id, titolo, durata FROM canzoni WHERE album_id = %s"
    cursor.execute(query_canzoni, (album_id,))
    canzoni = cursor.fetchall()
    
    album['canzoni'] = canzoni
    
    cursor.close()
    conn.close()
    return jsonify(album), 200

# ---------------------------------------------------------
# 5. GET /api/artista/<id>
# ---------------------------------------------------------
@app.route('/api/artista/<int:artista_id>', methods=['GET'])
def get_artista_dettaglio(artista_id):
    """Recupera i dettagli di un artista e tutti gli album della sua discografia"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Informazioni dell'artista
    query_artista = "SELECT id, nome, foto, genere FROM artisti WHERE id = %s"
    cursor.execute(query_artista, (artista_id,))
    artista = cursor.fetchone()
    
    if not artista:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Artista non trovato'}), 404
        
    # 2. Album dell'artista
    query_albums = "SELECT id, titolo, copertina FROM albums WHERE artista_id = %s"
    cursor.execute(query_albums, (artista_id,))
    albums = cursor.fetchall()
    
    artista['albums'] = albums
    
    cursor.close()
    conn.close()
    return jsonify(artista), 200

# ---------------------------------------------------------
# 6. GET /api/playlist
# ---------------------------------------------------------
@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    """Recupera le playlist di un utente specifico (passato come query param) comprensive di canzoni"""
    utente_id = request.args.get('utenteId')
    if not utente_id:
        return jsonify({'error': 'Parametro utenteId mancante'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Recupera le playlist dell'utente
    query_p = "SELECT id, nome FROM playlists WHERE utente_id = %s"
    cursor.execute(query_p, (utente_id,))
    playlists = cursor.fetchall()
    
    # Per ogni playlist, estrae le canzoni associate tramite JOIN relazionale
    for p in playlists:
        query_c = """
            SELECT c.id, c.titolo, art.nome as artista 
            FROM playlist_canzoni pc
            JOIN canzoni c ON pc.canzone_id = c.id
            JOIN artisti art ON c.artista_id = art.id
            WHERE pc.playlist_id = %s
        """
        cursor.execute(query_c, (p['id'],))
        p['canzoni'] = cursor.fetchall()
        
    cursor.close()
    conn.close()
    return jsonify(playlists), 200

# ---------------------------------------------------------
# 7. POST /api/playlist
# ---------------------------------------------------------
@app.route('/api/playlists', methods=['POST'])
def crea_playlist():
    """Crea una nuova playlist per un utente"""
    dati = request.json
    nome = dati.get('nome')
    utente_id = dati.get('utenteId')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "INSERT INTO playlists (nome, utente_id) VALUES (%s, %s)"
    cursor.execute(query, (nome, utente_id))
    conn.commit()
    nuovo_id = cursor.lastrowid
    
    cursor.close()
    conn.close()
    return jsonify({'id': nuovo_id, 'message': 'Playlist creata'}), 201

# ---------------------------------------------------------
# 8. DELETE /api/playlist/<id>
# ---------------------------------------------------------
@app.route('/api/playlists/<int:playlist_id>', methods=['DELETE'])
def elimina_playlist(playlist_id):
    """Elimina una playlist esistente e svuota i suoi collegamenti"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Rimuoviamo prima i vincoli di associazione canzoni (per sicurezza d'integrità)
    query_vincoli = "DELETE FROM playlist_canzoni WHERE playlist_id = %s"
    cursor.execute(query_vincoli, (playlist_id,))
    
    # Elimina la playlist reale
    query_p = "DELETE FROM playlists WHERE id = %s"
    cursor.execute(query_p, (playlist_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Playlist eliminata con successo'}), 200

# ---------------------------------------------------------
# 9. GET /api/canzoni
# ---------------------------------------------------------
@app.route('/api/canzoni', methods=['GET'])
def get_tutte_canzoni():
    """Recupera l'elenco globale di tutte le canzoni presenti nel catalogo"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT c.id, c.titolo, art.nome as artista 
        FROM canzoni c
        JOIN artisti art ON c.artista_id = art.id
    """
    cursor.execute(query)
    canzoni = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(canzoni), 200

# ---------------------------------------------------------
# 10. POST /api/playlist/canzone (Aggiungi a playlist)
# ---------------------------------------------------------
@app.route('/api/playlists/<int:playlist_id>/canzoni', methods=['POST'])
def aggiungi_canzone_playlist(playlist_id):
    """Inietta una traccia musicale all'interno di una playlist esistente"""
    dati = request.json
    canzone_id = dati.get('canzoneId')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "INSERT INTO playlist_canzoni (playlist_id, canzone_id) VALUES (%s, %s)"
    try:
        cursor.execute(query, (playlist_id, canzone_id))
        conn.commit()
        return jsonify({'message': 'Canzone aggiunta alla playlist'}), 201
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# 11. DELETE /api/playlist/canzone (Rimuovi da playlist)
# ---------------------------------------------------------
@app.route('/api/playlists/<int:playlist_id>/canzoni/<int:canzone_id>', methods=['DELETE'])
def rimuovi_canzone_playlist(playlist_id, canzone_id):
    """Rimuove la traccia musicale selezionata dall'interno della playlist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "DELETE FROM playlist_canzoni WHERE playlist_id = %s AND canzone_id = %s"
    cursor.execute(query, (playlist_id, canzone_id))
    conn.commit()
    
    cursor.close()
    conn.close()
    return jsonify({'message': 'Canzone rimossa dalla playlist'}), 200

if __name__ == '__main__':
    # Avviamo il server in modalità di debug locale sulla porta 5000 (coerente con l'apiUrl di Angular)
    app.run(host='0.0.0.0', port=5000, debug=True)
