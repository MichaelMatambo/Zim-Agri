import json, math, random
random.seed(42)
W = [
("Harare Ward 7 (Mbare)","Harare","Harare",-17.86,31.04,"clay",850,"IIa"),
("Harare Ward 21 (Highfield)","Harare","Harare",-17.90,30.98,"red",840,"IIa"),
("Harare Ward 42 (Borrowdale)","Harare","Harare",-17.76,31.09,"red",860,"IIa"),
("Harare Ward 18 (Epworth)","Harare","Harare",-17.89,31.15,"sandy_loam",830,"IIa"),
("Marondera Ward 3","Marondera","Mashonaland East",-18.19,31.55,"sandy_loam",880,"IIa"),
("Marondera Ward 8","Marondera","Mashonaland East",-18.27,31.46,"sandy_loam",860,"IIa"),
("Murewa Ward 5","Murewa","Mashonaland East",-17.65,31.78,"sandy_loam",820,"IIa"),
("Murewa Ward 12","Murewa","Mashonaland East",-17.76,31.90,"red",800,"IIb"),
("Goromonzi Ward 6","Goromonzi","Mashonaland East",-17.80,31.35,"red",820,"IIa"),
("Chegutu Ward 4","Chegutu","Mashonaland West",-18.13,30.14,"red",780,"IIb"),
("Chegutu Ward 10","Chegutu","Mashonaland West",-18.24,30.28,"clay",760,"IIb"),
("Hurungwe Ward 2","Hurungwe","Mashonaland West",-16.68,29.45,"red",720,"IIb"),
("Hurungwe Ward 14","Hurungwe","Mashonaland West",-16.86,29.78,"sandy_loam",760,"IIb"),
("Kadoma Ward 5","Kadoma","Mashonaland West",-18.33,29.91,"sandy_loam",700,"III"),
("Bindura Ward 3","Bindura","Mashonaland Central",-17.30,31.33,"red",850,"IIa"),
("Mazowe Ward 9","Mazowe","Mashonaland Central",-17.50,30.97,"red",900,"IIa"),
("Shamva Ward 6","Shamva","Mashonaland Central",-17.31,31.57,"sandy_loam",820,"IIa"),
("Guruve Ward 4","Guruve","Mashonaland Central",-16.66,30.70,"sandy_loam",750,"IIb"),
("Gweru Ward 5","Gweru","Midlands",-19.45,29.81,"sandy_loam",650,"III"),
("Gweru Ward 12","Gweru","Midlands",-19.58,29.68,"sandy_loam",620,"III"),
("Kwekwe Ward 7","Kwekwe","Midlands",-18.93,29.81,"clay",640,"III"),
("Kwekwe Ward 15","Kwekwe","Midlands",-18.83,29.97,"sandy_loam",660,"III"),
("Shurugwi Ward 2","Shurugwi","Midlands",-19.67,30.00,"red",700,"III"),
("Zvishavane Ward 3","Zvishavane","Midlands",-20.33,30.06,"sandy_loam",500,"IV"),
("Mutare Ward 6","Mutare","Manicaland",-18.97,32.67,"red",1050,"I"),
("Chipinge Ward 9","Chipinge","Manicaland",-20.19,32.62,"red",1000,"I"),
("Makoni Ward 11","Makoni","Manicaland",-18.28,32.17,"sandy_loam",900,"IIa"),
("Chimanimani Ward 4","Chimanimani","Manicaland",-19.80,32.87,"red",1150,"I"),
("Buhera Ward 8","Buhera","Manicaland",-19.33,31.42,"sandy_loam",520,"IV"),
]
def suit(z,soil):
    m={"I":"Medium","IIa":"High","IIb":"High","III":"Medium","IV":"Low","V":"Low"}[z]
    if soil=="clay" and z in("IIa","IIb"): m="Medium" if z=="IIb" else "High"
    g={"I":"Medium","IIa":"High","IIb":"High","III":"High","IV":"Medium","V":"Low"}[z]
    if soil=="clay": g="Medium" if g=="High" else "Low"
    if soil=="sandy_loam" and z=="IV": g="Medium"
    s={"I":"Low","IIa":"Medium","IIb":"Medium","III":"High","IV":"High","V":"Medium"}[z]
    return m,g,s
feats=[]
for n,d,p,lat,lon,soil,rain,z in W:
    m,g,s=suit(z,soil)
    ring=[]
    for k in range(8):
        a=2*math.pi*k/8; r=0.085*(0.8+0.4*random.random())
        ring.append([round(lon+r*math.cos(a)*1.02,3),round(lat+r*math.sin(a),3)])
    ring.append(ring[0])
    feats.append({"type":"Feature","properties":{"ward_name":n,"district":d,"province":p,"soil_type":soil,"rainfall_mm":rain,"rainfall_zone":z,"maize_suitability":m,"groundnut_suitability":g,"sorghum_suitability":s},"geometry":{"type":"Polygon","coordinates":[ring]}})
def save(name,f): json.dump({"type":"FeatureCollection","features":f},open(f"assets/geojson/{name}.geojson","w"),separators=(",",":"))
save("wards",feats)
M=[("Mbare Musika","Wholesale market",-17.8604,31.0395),("GMB Harare Depot","GMB depot",-17.8420,31.0170),("GMB Bulawayo Depot","GMB depot",-20.1500,28.5700),("Sakubva Musika (Mutare)","Wholesale market",-18.9900,32.6300),("Mkoba Market (Gweru)","Town market",-19.4900,29.7900),("Mbizo Market (Kwekwe)","Town market",-18.9200,29.8100),("Mucheke Market (Masvingo)","Town market",-20.0800,30.8300),("Chinhoyi Market","Town market",-17.3600,30.2000),("Marondera Market","Town market",-18.1850,31.5500),("Bindura Market","Town market",-17.3000,31.3300),("Kadoma Market","Town market",-18.3300,29.9100),("Chegutu Market","Town market",-18.1300,30.1400),("Mzilikazi Market (Bulawayo)","Wholesale market",-20.1600,28.5600),("Chipinge Market","Town market",-20.1900,32.6200),("Karoi Market","Town market",-16.8100,29.6900)]
save("markets",[{"type":"Feature","properties":{"name":n,"type":t,"lat":la,"lon":lo},"geometry":{"type":"Point","coordinates":[lo,la]}} for n,t,la,lo in M])
R=[("Manyame River","river",[[31.55,-18.20],[31.20,-18.00],[31.00,-17.93],[30.75,-17.90],[30.40,-17.60],[30.05,-16.95],[29.95,-16.30]]),
("Mazowe River","river",[[30.95,-17.60],[31.20,-17.45],[31.55,-17.20],[32.00,-16.90],[32.60,-16.60]]),
("Sanyati River","river",[[29.95,-18.30],[29.60,-17.80],[29.10,-17.25],[28.85,-16.75]]),
("Save River","river",[[31.45,-18.60],[31.30,-19.30],[31.90,-20.00],[32.30,-20.60]]),
("Limpopo River","river",[[29.35,-22.15],[30.00,-22.28],[30.80,-22.30]]),
("Runde River","river",[[30.10,-19.40],[30.10,-20.10],[30.50,-20.60],[31.60,-21.20]]),
("Lake Chivero (dam wall)","dam",[[30.79,-17.91],[30.81,-17.90]]),
("Lake Mutirikwi (dam wall)","dam",[[30.82,-20.23],[30.84,-20.22]]),
("Mazvikadei Dam (wall)","dam",[[30.29,-17.61],[30.31,-17.60]]),
("Osborne Dam (wall)","dam",[[32.61,-19.10],[32.63,-19.09]]),]
save("rivers",[{"type":"Feature","properties":{"name":n,"kind":k},"geometry":{"type":"LineString","coordinates":c}} for n,k,c in R])
E=[("Agritex Officer - Harare South","Agritex Officer","+263 77 000 0001","Harare Ward 7",-17.88,31.03),
("Agritex Officer - Goromonzi","Agritex Officer","+263 77 000 0002","Goromonzi Ward 6",-17.82,31.37),
("Agritex Officer - Marondera","Agritex Officer","+263 77 000 0003","Marondera Ward 3",-18.20,31.56),
("Agritex Officer - Murewa","Agritex Officer","+263 77 000 0004","Murewa Ward 5",-17.64,31.77),
("Agritex Officer - Chegutu","Agritex Officer","+263 77 000 0005","Chegutu Ward 4",-18.14,30.15),
("Agritex Officer - Hurungwe","Agritex Officer","+263 77 000 0006","Hurungwe Ward 2",-16.70,29.47),
("Agritex Officer - Bindura","Agritex Officer","+263 77 000 0007","Bindura Ward 3",-17.31,31.34),
("Agritex Officer - Gweru","Agritex Officer","+263 77 000 0008","Gweru Ward 5",-19.46,29.82),
("Agritex Officer - Kwekwe","Agritex Officer","+263 77 000 0009","Kwekwe Ward 7",-18.92,29.82),
("Agritex Officer - Mutare","Agritex Officer","+263 77 000 0010","Mutare Ward 6",-18.96,32.66),
("Veterinary Officer - Harare","Veterinary Officer","+263 77 000 0011","Harare Ward 42",-17.78,31.06),
("Input Supplier - Marondera Agro-dealer","Input Supplier","+263 77 000 0012","Marondera Ward 8",-18.19,31.54)]
save("experts",[{"type":"Feature","properties":{"name":n,"role":r,"phone":p,"ward":w},"geometry":{"type":"Point","coordinates":[lo,la]}} for n,r,p,w,la,lo in E])
