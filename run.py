import Flask, request, jsonify, render_template, url_for
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
from werkzeug.utils import secure_filename
import uuid

# --- App Setup ---
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

UPLOAD_FOLDER = os.path.join("static", "uploads")
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- DB Helper ---
def get_db_connection():
    conn = sqlite3.connect("lost_found.db")
    conn.row_factory = sqlite3.Row
    return conn

# --- Init DB ---
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT CHECK(type IN ('lost','found','sell')) NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            category_id INTEGER,
            location TEXT,
            contact_info TEXT,
            image_path TEXT,
            price REAL,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    cursor.executemany(
        "INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)",
        [(1,"Electronics"),(2,"Clothing"),(3,"Accessories"),(4,"Books"),(5,"Others")]
    )

    cursor.executemany(
        """INSERT OR IGNORE INTO items 
        (id,type,title,description,category_id,location,contact_info,price,status,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)""",
        [
            (1,"lost","Lost iPhone 13","Black iPhone 13 with cracked screen, lost near campus library",1,"University Library","john@email.com",None,"active","2024-09-10 10:00:00"),
            (2,"found","Found Car Keys","Set of car keys with Honda keychain found in parking lot",3,"Main Parking Lot","mary@email.com",None,"active","2024-09-09 14:30:00"),
            (3,"sell","Laptop for Sale","Dell laptop in good condition, 8GB RAM, 256GB SSD",1,"Downtown","seller@email.com",450.00,"active","2024-09-08 16:45:00")
        ]
    )

    conn.commit()
    conn.close()

init_db()

# --- File Upload Helper ---
def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    return render_template("index.html")

# Get all items
@app.route("/api/items", methods=["GET"])
def get_items():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            SELECT i.*, c.name as category_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE 1=1
        """
        filters, params = [], []

        if request.args.get("type"):
            filters.append("i.type=?")
            params.append(request.args["type"])
        if request.args.get("category_id"):
            filters.append("i.category_id=?")
            params.append(request.args["category_id"])
        if request.args.get("location"):
            filters.append("i.location LIKE ?")
            params.append(f"%{request.args['location']}%")
        if request.args.get("status"):
            filters.append("i.status=?")
            params.append(request.args["status"])

        if filters:
            query += " AND " + " AND ".join(filters)

        query += " ORDER BY datetime(i.created_at) DESC LIMIT ? OFFSET ?"
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        params.extend([limit, offset])

        cursor.execute(query, params)
        items = [dict(row) for row in cursor.fetchall()]
        for item in items:
            if item["image_path"]:
                item["image_url"] = url_for("static", filename=f"uploads/{item['image_path']}", _external=True)
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Add new item
@app.route("/api/items", methods=["POST"])
def add_item():
    try:
        data = request.form
        type_ = data.get("type")
        title = data.get("title")
        description = data.get("description")
        category_id = data.get("category_id")
        location = data.get("location")
        contact_info = data.get("contact_info")
        price = data.get("price")

        image_path = None
        if "image" in request.files:
            file = request.files["image"]
            if file and allowed_file(file.filename):
                ext = secure_filename(file.filename).rsplit(".",1)[1].lower()
                filename = f"{uuid.uuid4().hex}.{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                image_path = filename

        conn = get_db_connection()
        cursor = conn.cursor()
        created_at = datetime.now().isoformat()

        cursor.execute("""
            INSERT INTO items (type,title,description,category_id,location,contact_info,image_path,price,created_at)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (type_, title, description, category_id, location, contact_info, image_path, price, created_at))

        item_id = cursor.lastrowid
        conn.commit()

        cursor.execute("""
            SELECT i.*, c.name as category_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id=?
        """, (item_id,))
        new_item = dict(cursor.fetchone())

        if new_item["image_path"]:
            new_item["image_url"] = url_for("static", filename=f"uploads/{new_item['image_path']}", _external=True)

        return jsonify({"success": True, "item": new_item})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

# Search
@app.route("/api/search", methods=["GET"])
def search_items():
    try:
        keyword = request.args.get("q","")
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)

        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            SELECT i.*, c.name as category_name
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE LOWER(i.title) LIKE ? OR LOWER(i.description) LIKE ?
            ORDER BY datetime(i.created_at) DESC
            LIMIT ? OFFSET ?
        """
        params = [f"%{keyword.lower()}%", f"%{keyword.lower()}%", limit, offset]
        cursor.execute(query, params)
        items = [dict(row) for row in cursor.fetchall()]
        for item in items:
            if item["image_path"]:
                item["image_url"] = url_for("static", filename=f"uploads/{item['image_path']}", _external=True)
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Categories
@app.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories ORDER BY name")
        return jsonify([dict(row) for row in cursor.fetchall()])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# --- Run ---
if __name__ == "__main__":
    app.run(debug=True)
