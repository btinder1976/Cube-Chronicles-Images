import json
def esc(s):
    if s is None: return "NULL"
    return "'"+str(s).replace("'","''")+"'"
books=json.load(open("src/content/books.json"))
sfaqs=json.load(open("src/content/series-faqs.json"))
NOW="2026-07-14T00:00:00.000Z"
lines=["-- Seed data: 15 verified books + manuscript-grounded editorial FAQs.",
       "-- Generated from src/content/*.json. Contains NO user/personal data.",
       "-- Safe to re-run: uses INSERT OR REPLACE.",""]
for b in books:
    lines.append("INSERT OR REPLACE INTO books (slug,number,title,subtitle,setting_place,setting_region,era,age_range,page_count,word_count,updated_at) VALUES ("
        f"{esc(b['slug'])},{b['number']},{esc(b['title'])},{esc(b['subtitle'])},{esc(b['settingPlace'])},{esc(b['settingRegion'])},{esc(b['era'])},{esc(b['ageRange'])},{b['pageCount']},{b['wordCount']},{esc(NOW)});")
lines.append("")
for b in books:
    for i,f in enumerate(b['faqs']):
        lines.append("INSERT OR REPLACE INTO editorial_faqs (id,book_slug,anchor,question,answer,is_spoiler,sort_order,updated_at) VALUES ("
            f"{esc(f['id'])},{esc(b['slug'])},{esc(f['anchor'])},{esc(f['q'])},{esc(f['a'])},{1 if f['spoiler'] else 0},{i},{esc(NOW)});")
lines.append("")
for i,f in enumerate(sfaqs):
    lines.append("INSERT OR REPLACE INTO editorial_faqs (id,book_slug,anchor,question,answer,is_spoiler,sort_order,updated_at) VALUES ("
        f"{esc(f['id'])},NULL,{esc(f['anchor'])},{esc(f['q'])},{esc(f['a'])},{1 if f['spoiler'] else 0},{i},{esc(NOW)});")
open("db/seed.sql","w").write("\n".join(lines)+"\n")
print("seed.sql rows:", len(lines))
