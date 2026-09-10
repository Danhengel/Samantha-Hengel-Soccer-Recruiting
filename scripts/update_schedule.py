from urllib.request import urlopen, Request
from datetime import datetime, timezone
from pathlib import Path
import json, re

URL='https://ssprodst.blob.core.windows.net/calendars/481/113342.ics'

def unfold(text):
    return re.sub(r'\r?\n[ \t]', '', text)

def val(block,key):
    m=re.search(r'^'+re.escape(key)+r'(?:;[^:]*)?:(.*)$',block,re.M)
    return m.group(1).strip().replace('\\,',',').replace('\\n',' ') if m else ''

def dt(v):
    if not v: return ''
    v=v.strip()
    for fmt in ('%Y%m%dT%H%M%SZ','%Y%m%dT%H%M%S','%Y%m%d'):
        try:
            d=datetime.strptime(v,fmt)
            if v.endswith('Z'): d=d.replace(tzinfo=timezone.utc)
            return d.isoformat()
        except ValueError: pass
    return v

req=Request(URL,headers={'User-Agent':'Samantha-Hengel-Recruiting-Schedule/1.0'})
text=unfold(urlopen(req,timeout=30).read().decode('utf-8-sig'))
events=[]
for block in re.findall(r'BEGIN:VEVENT(.*?)END:VEVENT',text,re.S):
    start=dt(val(block,'DTSTART'))
    events.append({'start':start,'end':dt(val(block,'DTEND')),'title':val(block,'SUMMARY'),'location':val(block,'LOCATION'),'description':val(block,'DESCRIPTION'),'url':val(block,'URL')})
events.sort(key=lambda x:x['start'])
Path('data').mkdir(exist_ok=True)
Path('data/schedule.json').write_text(json.dumps({'source':URL,'updated':datetime.now(timezone.utc).isoformat(),'events':events},indent=2),encoding='utf-8')
print(f'Wrote {len(events)} events')
