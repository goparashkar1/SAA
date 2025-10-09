import time
import psycopg2
import subprocess
import json
from sentence_transformers import SentenceTransformer
from datetime import datetime

FRESHRSS_DB = {
    "dbname": "freshrss",
    "user": "freshrss",
    "password": "freshrss",
    "host": "freshrss-db",
    "port": 5432,
}

MODEL = SentenceTransformer("all-MiniLM-L6-v2")

def get_new_freshrss_entries():
    """Fetch unread/new articles from FreshRSS DB"""
    conn = psycopg2.connect(**FRESHRSS_DB)
    cur = conn.cursor()

    # Fetch last 20 unread entries
    cur.execute(
        """
        SELECT id, link, title, date
        FROM admin_entry
        WHERE is_read = 0
        ORDER BY date DESC
        LIMIT 20
        """
    )
    rows = cur.fetchall()

    results = []
    for r in rows:
        results.append(
            {
                "id": r[0],
                "url": r[1],
                "title": r[2],
                "published_at": datetime.fromtimestamp(r[3]) if r[3] else None,
            }
        )

    cur.close()
    conn.close()
    return results

def mark_entries_as_read(entry_ids):
    """Mark entries as read in the database"""
    if not entry_ids:
        return
    
    conn = psycopg2.connect(**FRESHRSS_DB)
    cur = conn.cursor()
    
    cur.execute(
        """
        UPDATE admin_entry
        SET is_read = 1
        WHERE id = ANY(%s)
        """,
        (entry_ids,),
    )
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Marked {len(entry_ids)} entries as read")

def run_translator_agent(url: str):
    """Run your translator_agent script to fetch content and check result"""
    try:
        cmd = [
            "python",
            "-m",
            "app",
            "url",
            url,
            "--out",
            "docx",
            "--dest",
            "verbose",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Check if the command was successful
        if result.returncode == 0:
            return result.stdout.strip(), True
        else:
            print(f"Translator agent failed for {url}: Command returned non-zero exit status {result.returncode}")
            print(f"Stderr: {result.stderr}")
            return None, False
            
    except subprocess.CalledProcessError as e:
        print(f"Translator agent failed for {url}: {e}")
        print(f"Stderr: {e.stderr}")
        return None, False
    except Exception as e:
        print(f"Unexpected error in translator agent for {url}: {e}")
        return None, False

def save_to_vector_db(entries):
    """Process entries and save to vector database, mark as read only on success"""
    conn = psycopg2.connect(**FRESHRSS_DB)
    cur = conn.cursor()
    
    successful_entry_ids = []
    
    for e in entries:
        content, success = run_translator_agent(e["url"])
        
        if not success:
            print(f"❌ Skipping entry {e['id']} due to translator failure")
            continue
            
        if not content:
            print(f"⚠️  No content returned for entry {e['id']}, but command succeeded")
            continue

        try:
            embedding = MODEL.encode(content).tolist()

            cur.execute(
                """
                INSERT INTO news_articles (url, freshrss_id, title, content, published_at, embedding)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
                """,
                (e["url"], e["id"], e["title"], content, e["published_at"], embedding),
            )
            
            # Only mark as read if both translator and DB insertion succeeded
            successful_entry_ids.append(e["id"])
            print(f"✅ Successfully processed entry {e['id']}")
            
        except Exception as db_error:
            print(f"❌ Database error for entry {e['id']}: {db_error}")
            continue
    
    conn.commit()
    cur.close()
    conn.close()
    
    # Mark successful entries as read
    if successful_entry_ids:
        mark_entries_as_read(successful_entry_ids)
    else:
        print("❌ No entries were successfully processed")

def main_loop():
    while True:
        print("🔍 Checking FreshRSS for new entries...")
        entries = get_new_freshrss_entries()
        if entries:
            print(f"➡ Found {len(entries)} new entries")
            save_to_vector_db(entries)
        else:
            print("No new entries.")

        time.sleep(30)  # wait 5 minutes

if __name__ == "__main__":
    main_loop()