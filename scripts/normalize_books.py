import json, re, os, glob

BOOK_DATA="/home/claude/book_data"
OUT="/home/claude/cubechronicles/src/content/books.json"

# word counts & page counts (from KDP report + extraction)
WORDS={1:127754,2:107912,3:88599,4:79738,5:55827,6:52483,7:49771,8:48997,9:49139,10:51638,11:48909,12:49012,13:49085,14:48660,15:48683}
PAGES={1:591,2:417,3:358,4:314,5:221,6:198,7:175,8:174,9:177,10:174,11:172,12:176,13:174,14:170,15:164}

# canonical required titles (authoritative spelling)
REQUIRED={
1:"The Shed, The Cube, and The Sands of Time",
2:"The Compass, The Coast, and The Edge of the World",
3:"The River, The Seal, and The Language of Silence",
4:"The Knot, The Flame, and The Bones That Speak",
5:"The Shore, The Flame, and The Shape of Water",
6:"The River, The Wheel, and The City of the Moon",
7:"The Rope, The Ridge, and The Roof of the World",
8:"The Seed, The Soil, and The Cities Beneath the Green",
9:"The Rain, The Cedar, and The Rivers of Silver",
10:"The Fire, The Threshold, and The Stranger at the Door",
11:"The Break, The Gold, and The Palace That Rose Again",
12:"The Song, The Stars, and The Country That Remembers",
13:"The Canoe, The Compass, and The Shore Beyond the Sky",
14:"The Crossroads, The Weave, and The Road of All Roads",
15:"The Center, The Maker, and The Road That Was Always Home",
}

# folder names on the user's device (for provenance / audit)
FOLDER={
1:"Book 1 - The Shed, The Cube, and The Sands of Time",
2:"Book 2 - The Compass, The Coast, and The Edge of the World",
3:"Book 3 - The River, The Seal, and The Language of Silence",
4:"Book 4 - The Knot, The Flame, and The Bones That Speak",
5:"Book 5 - The Shore, The Flame, and The Shape of Water",
6:"Book 6 - The River, The Wheel, and The City of the Moon",
7:"Book 7 - The Rope, The Ridge, and The Roof of the World",
8:"Book 8 - The Seed, The Soil, and The Cities Beneath the Green",
9:"Book 9 - The Rain, The Cedar, and The Rivers of Silver",
10:"Book 10 - The Fire, The Threshold, and The Stranger at the Door",
11:"Book 11 - The Break, The Gold, and The Palace That Rose Again",
12:"Book 12 - The Song, The Stars, and The Country That Remembers",
13:"Book 13 - The Canoe, The Compass, and The Shore Beyond the Sky",
14:"Book 14 - The Crossroads, The Weave, and The Road of All Roads",
15:"Book 15 - The Center, The Maker, and The Road That Was Always Home",
}
# image subfolder + front-cover filename on device
IMGDIR={1:"Book_01 Images",2:"Book_02 Images",3:"Book_03 Images"}
for n in range(4,16): IMGDIR[n]=f"Book {n} Images"
COVER={
1:"Book_01_The_Shed_The_Cube_and_The_Sands_of_Time_eBook_KDP_1600x2560.jpg",
2:"Book_02_The_Compass_The_Coast_and_The_Edge_of_the_World_eBook_KDP_1600x2560.jpg",
3:"Book_03_The_River_The_Seal_and_The_Language_of_Silence_eBook_KDP_1600x2560.jpg",
4:"Book_4_The_Knot_The_Flame_and_The_Bones_That_Speak_eBook_KDP_1600x2560.jpg",
5:"Book_5_The_Shore_The_Flame_and_The_Shape_of_Water_eBook_KDP_1600x2560.jpg",
6:"Book_6_The_River_The_Wheel_and_The_City_of_the_Moon_eBook_KDP_1600x2560.jpg",
7:"Book_7_The_Rope_The_Ridge_and_The_Roof_of_the_World_eBook_KDP_1600x2560.jpg",
8:"Book_8_The_Seed_The_Soil_and_The_Cities_Beneath_the_Green_eBook_KDP_1600x2560.jpg",
9:"Book_9_The_Rain_The_Cedar_and_The_Rivers_of_Silver_eBook_KDP_1600x2560.jpg",
10:"Book_10_The_Fire_The_Threshold_and_The_Stranger_at_the_Door_eBook_KDP_1600x2560.jpg",
11:"Book_11_The_Break_The_Gold_and_The_Palace_That_Rose_Again_eBook_KDP_1600x2560.jpg",
12:"Book_12_The_Song_The_Stars_and_The_Country_That_Remembers_eBook_KDP_1600x2560.jpg",
13:"Book_13_The_Canoe_The_Compass_and_The_Shore_Beyond_the_Sky_eBook_KDP_1600x2560.jpg",
14:"Book_14_The_Crossroads_The_Weave_and_The_Road_of_All_Roads_eBook_KDP_1600x2560.jpg",
15:"Book_15_The_Center_The_Maker_and_The_Road_That_Was_Always_Home_eBook_KDP_1600x2560.jpg",
}

def slugify(s):
    s=s.lower()
    s=s.replace("&","and")
    s=re.sub(r"[',]", "", s)
    s=re.sub(r"[^a-z0-9]+","-",s)
    return s.strip("-")

books=[]
audit=[]
for n in range(1,16):
    d=json.load(open(f"{BOOK_DATA}/book{n:02d}.json"))
    title=REQUIRED[n]
    if d.get("title","").strip()!=title:
        audit.append(f"Book {n}: agent title '{d.get('title')}' normalized to required '{title}'")
    slug=f"{n:02d}-"+slugify(title)
    # normalize faqs -> add stable ids/anchors
    faqs=[]
    for i,f in enumerate(d.get("faqs",[]),1):
        q=f.get("q","").strip(); a=f.get("a","").strip()
        if not q or not a: continue
        faqs.append({
            "id":f"b{n:02d}-faq{i:02d}",
            "anchor":f"faq-{i:02d}",
            "q":q,"a":a,
            "spoiler":bool(f.get("spoiler",False)),
            "tags":f.get("tags",[]) if isinstance(f.get("tags",[]),list) else [f.get("tags")]
        })
    book={
        "number":n,
        "title":title,
        "subtitle":d.get("subtitle","").strip(),
        "slug":slug,
        "url":f"/books/{slug}/",
        "coverImage":f"book-{n:02d}.jpg",              # normalized asset base name (optimized derivatives generated at build)
        "coverAlt":f"Cover of {title} — The Cube Chronicles Book {n} of 15",
        "coverSource":f"{FOLDER[n]}/{IMGDIR[n]}/{COVER[n]}",
        "settingPlace":d.get("setting_place","").strip(),
        "settingRegion":d.get("setting_region","").strip(),
        "era":d.get("era","").strip(),
        "eraTag":d.get("era_tag","").strip(),
        "mainCharacters":d.get("main_characters",[]),
        "premise":d.get("premise","").strip(),
        "teaser":d.get("teaser","").strip(),
        "themes":d.get("themes",[]),
        "learningTopics":d.get("learning_topics",[]),
        "ageRange":d.get("age_range","").strip() or "8–12 (middle grade)",
        "contentNotes":d.get("content_notes","").strip(),
        "chapterCount":d.get("chapter_count",30),
        "parts":d.get("parts",[]),
        "nextBookHook":d.get("next_book_hook","").strip(),
        "wordCount":WORDS[n],
        "pageCount":PAGES[n],
        "prevSlug":(f"{n-1:02d}-"+slugify(REQUIRED[n-1])) if n>1 else None,
        "nextSlug":(f"{n+1:02d}-"+slugify(REQUIRED[n+1])) if n<15 else None,
        "faqs":faqs,
    }
    books.append(book)

json.dump(books, open(OUT,"w"), indent=2, ensure_ascii=False)
print(f"Wrote {OUT} with {len(books)} books, total FAQs = {sum(len(b['faqs']) for b in books)}")
for a in audit: print("AUDIT:", a)
