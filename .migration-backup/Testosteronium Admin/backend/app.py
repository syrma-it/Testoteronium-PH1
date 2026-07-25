from flask import Flask, jsonify
from flask_cors import CORS

from routes.tracked import tracked_bp
from routes.manual import manual_bp
from routes.fetching import fetching_bp
from routes.summary import summary_bp
from routes.patch import patch_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(tracked_bp)
app.register_blueprint(manual_bp)
app.register_blueprint(fetching_bp)
app.register_blueprint(summary_bp)
app.register_blueprint(patch_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "testosteronium-backend"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)