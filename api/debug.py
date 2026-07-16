from http.server import BaseHTTPRequestHandler
import traceback

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        logs = []
        def log(msg): logs.append(msg)
        
        log("Starting debug imports...")
        try:
            import os; log("os imported")
            import uuid; log("uuid imported")
            
            log("Importing fastapi...")
            import fastapi; log("fastapi imported")
            
            log("Importing pydantic...")
            import pydantic; log("pydantic imported")
            
            log("Importing bcrypt...")
            import bcrypt; log("bcrypt imported")
            
            log("Importing passlib...")
            import passlib; log("passlib imported")
            
            log("Importing libsql_client...")
            import libsql_client; log("libsql_client imported")
            
            log("Importing jwt...")
            import jwt; log("jwt imported")
            
            log("Importing requests...")
            import requests; log("requests imported")
            
            self.send_response(200)
        except Exception as e:
            log(f"ERROR: {traceback.format_exc()}")
            self.send_response(500)
            
        self.send_header('Content-type','text/plain')
        self.end_headers()
        self.wfile.write("\n".join(logs).encode('utf-8'))
