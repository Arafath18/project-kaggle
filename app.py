import os
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

# Cache configuration
CACHE_DURATION = 600  # 10 minutes cache
cache = {
    "data": None,
    "last_fetched": 0
}

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_html_content(content_html):
    """
    Parses the CDATA HTML content of a feed entry and splits it into individual updates.
    Updates are separated by <h3> tags indicating their category (Feature, Change, Issue, Deprecation, etc.).
    """
    if not content_html:
        return []
        
    soup = BeautifulSoup(content_html, 'html.parser')
    items = []
    
    current_type = "General"
    current_content = []
    
    # Iterate through direct children of body/root of HTML
    for child in soup.contents:
        if child.name == 'h3':
            # Save previous item if it exists
            if current_content:
                html_str = ''.join(str(c) for c in current_content).strip()
                if html_str:
                    text_str = BeautifulSoup(html_str, 'html.parser').get_text().strip()
                    items.append({
                        "type": current_type,
                        "html": html_str,
                        "text": text_str
                    })
            current_type = child.get_text().strip()
            current_content = []
        else:
            current_content.append(child)
            
    # Add final item
    if current_content:
        html_str = ''.join(str(c) for c in current_content).strip()
        if html_str:
            text_str = BeautifulSoup(html_str, 'html.parser').get_text().strip()
            items.append({
                "type": current_type,
                "html": html_str,
                "text": text_str
            })
            
    # Fallback if no structured h3 items could be parsed
    if not items and content_html.strip():
        text_str = soup.get_text().strip()
        items.append({
            "type": "General",
            "html": content_html,
            "text": text_str
        })
        
    return items

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
    except Exception as e:
        # If fetch fails but we have cached data, return cache
        if cache["data"] is not None:
            return cache["data"], True
        raise e

    # Parse XML
    # Atom feeds use namespace
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError as e:
        raise ValueError(f"Failed to parse Atom feed XML: {e}")
        
    entries = []
    for entry_node in root.findall('atom:entry', ns):
        title = entry_node.find('atom:title', ns)
        title_text = title.text if title is not None else "Unknown Date"
        
        updated = entry_node.find('atom:updated', ns)
        updated_text = updated.text if updated is not None else ""
        
        entry_id = entry_node.find('atom:id', ns)
        id_text = entry_id.text if entry_id is not None else ""
        
        link_elem = entry_node.find("atom:link[@rel='alternate']", ns)
        link_href = link_elem.get('href') if link_elem is not None else ""
        
        content_elem = entry_node.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        # Parse individual sub-items inside the entry content
        items = parse_html_content(content_html)
        
        entries.append({
            "date": title_text,
            "updated": updated_text,
            "id": id_text,
            "link": link_href,
            "items": items
        })
        
    return entries, False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if force_refresh or cache["data"] is None or (now - cache["last_fetched"]) > CACHE_DURATION:
        try:
            data, was_cached_fallback = fetch_and_parse_feed()
            if not was_cached_fallback:
                cache["data"] = data
                cache["last_fetched"] = now
        except Exception as e:
            return jsonify({"error": f"Failed to fetch release notes: {str(e)}"}), 500
            
    return jsonify({
        "releases": cache["data"],
        "last_fetched": cache["last_fetched"],
        "cache_duration_seconds": CACHE_DURATION
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
