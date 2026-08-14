#!/usr/bin/env python3
"""Build tag pages from lucidnotes posts.

Reads about/lucidnotes/no.*.html for titles + tags, then:
  - writes about/lucidnotes/tags/index.html (full tag list, latest first)
  - writes about/lucidnotes/tags/<tag>.html (posts under that tag, with serials)
  - rewrites each post's tag links to those pages
  - patches the homepage "read by tags" row (latest 6, then ....)

Run from the repo root after adding tags to a post:

    python3 scripts/build-tags.py
"""

from __future__ import annotations

import re
from collections import OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTES = ROOT / "about" / "lucidnotes"
TAGS_DIR = NOTES / "tags"
HOME = ROOT / "index.html"

HEADING_RE = re.compile(
    r'<h1 class="post-heading">(.*?)</h1>', re.I | re.S
)
TAGS_BLOCK_RE = re.compile(
    r'(<p class="post-tags">)(.*?)(</p>)', re.I | re.S
)
TAG_TEXT_RE = re.compile(r"<a\b[^>]*>(.*?)</a>", re.I | re.S)
HOME_TAGS_RE = re.compile(
    r'(<p class="read-by-tags"[^>]*>)(.*?)(</p>)', re.I | re.S
)


def slugify(name: str) -> str:
    slug = name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def text_of(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html).strip()


def scan_posts() -> list[dict]:
    posts = []
    for path in NOTES.glob("no.*.html"):
        m = re.search(r"no\.(\d+)\.html$", path.name)
        if not m:
            continue
        html = path.read_text()
        title_m = HEADING_RE.search(html)
        block_m = TAGS_BLOCK_RE.search(html)
        tags = []
        if block_m:
            for am in TAG_TEXT_RE.finditer(block_m.group(2)):
                label = text_of(am.group(1))
                if label:
                    tags.append(label)
        posts.append(
            {
                "n": int(m.group(1)),
                "file": path.name,
                "path": path,
                "title": text_of(title_m.group(1)) if title_m else path.stem,
                "tags": tags,
                "html": html,
            }
        )
    posts.sort(key=lambda p: p["n"], reverse=True)
    return posts


def latest_tags(posts: list[dict]) -> list[str]:
    seen: OrderedDict[str, None] = OrderedDict()
    for post in posts:
        for tag in post["tags"]:
            if tag not in seen:
                seen[tag] = None
    return list(seen.keys())


def page_shell(title: str, body: str, css_depth: int = 3) -> str:
    prefix = "../" * css_depth
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | aravindirl</title>
    <meta name="robots" content="index, follow">
    <script>
    (function(){{try{{if(localStorage.getItem('theme')==='dark')document.documentElement.setAttribute('data-theme','dark');}}catch(e){{}}}})();
    </script>
    <link rel="stylesheet" href="{prefix}css/theme.css">
</head>
<body>
    <script>
    document.addEventListener('keydown',function(e){{
        if(e.key==='Backspace'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){{ e.preventDefault(); history.back(); }}
    }});
    </script>
    <div class="wrap">
        <p class="theme-line"><button type="button" class="theme-toggle" data-theme-toggle>dark</button></p>
{body}
    </div>
    <script src="{prefix}js/theme.js"></script>
</body>
</html>
"""


def write_tag_index(tags: list[str]) -> None:
    items = "\n".join(
        f'            <li><a href="{slugify(tag)}.html">{tag}</a></li>'
        for tag in tags
    )
    body = f"""        <h1>tags</h1>
        <p>read by tags</p>
        <ol>
{items}
        </ol>
        <a href="../index.html" class="back-link">← back to notes</a>"""
    (TAGS_DIR / "index.html").write_text(page_shell("tags", body))


def write_tag_page(tag: str, posts: list[dict]) -> None:
    items = []
    for post in posts:
        items.append(
            f'            <li value="{post["n"]}"><a href="../{post["file"]}">{post["title"]}</a></li>'
        )
    body = f"""        <h1>{tag}</h1>
        <ol>
{chr(10).join(items)}
        </ol>
        <a href="index.html" class="back-link">← back to tags</a>"""
    (TAGS_DIR / f"{slugify(tag)}.html").write_text(
        page_shell(tag, body)
    )


def rewrite_post_tags(post: dict) -> None:
    block_m = TAGS_BLOCK_RE.search(post["html"])
    if not block_m or not post["tags"]:
        return
    links = "\n".join(
        f'            <a href="tags/{slugify(tag)}.html">{tag}</a>'
        for tag in post["tags"]
    )
    new_block = f"{block_m.group(1)}\n{links}\n        {block_m.group(3)}"
    html = TAGS_BLOCK_RE.sub(new_block, post["html"], count=1)
    post["path"].write_text(html)


def patch_homepage(tags: list[str]) -> None:
    html = HOME.read_text()
    shown = tags[:6]
    links = ["            read by tags:&nbsp;"]
    for tag in shown:
        links.append(
            f'            <a href="about/lucidnotes/tags/{slugify(tag)}.html">{tag}</a>'
        )
    if len(tags) > 6:
        links.append(
            '            <a class="tags-more" href="about/lucidnotes/tags/">....</a>'
        )
    inner = "\n".join(links) + "\n        "
    if HOME_TAGS_RE.search(html):
        html = HOME_TAGS_RE.sub(
            r"\1\n" + inner + r"\3", html, count=1
        )
    else:
        raise SystemExit("homepage is missing <p class=\"read-by-tags\">")
    HOME.write_text(html)


def main() -> None:
    TAGS_DIR.mkdir(parents=True, exist_ok=True)
    posts = scan_posts()
    by_tag: dict[str, list[dict]] = defaultdict(list)
    for post in posts:
        rewrite_post_tags(post)
        for tag in post["tags"]:
            by_tag[tag].append(post)

    tags = latest_tags(posts)
    write_tag_index(tags)

    wanted = {slugify(t) for t in tags}
    for old in TAGS_DIR.glob("*.html"):
        if old.name == "index.html":
            continue
        if old.stem not in wanted:
            old.unlink()

    for tag, tagged in by_tag.items():
        write_tag_page(tag, tagged)

    patch_homepage(tags)
    print(f"tags: {len(tags)}  posts: {len(posts)}")
    print("latest:", ", ".join(tags[:6]) + (" ...." if len(tags) > 6 else ""))


if __name__ == "__main__":
    main()
