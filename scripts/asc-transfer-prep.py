#!/usr/bin/env python3
"""Prepare the app for an App Store app transfer: expire all TestFlight builds,
remove testers and beta groups, clear TestFlight Test Information.
MODE=dry only lists what it would do."""
import os, sys, time, json, jwt, requests
KEY_ID=os.environ['APP_STORE_CONNECT_KEY_ID']; ISS=os.environ['APP_STORE_CONNECT_ISSUER_ID']; PK=os.environ['APP_STORE_CONNECT_PRIVATE_KEY']
MODE=os.environ.get('MODE','dry'); BUNDLE=os.environ.get('BUNDLE','com.strideandstrength.app')
B='https://api.appstoreconnect.apple.com'
def tok(): return jwt.encode({'iss':ISS,'iat':int(time.time()),'exp':int(time.time())+1100,'aud':'appstoreconnect-v1'},PK,algorithm='ES256',headers={'kid':KEY_ID,'typ':'JWT'})
S=requests.Session()
def req(m,path,**kw):
    S.headers['Authorization']='Bearer '+tok()
    r=S.request(m,path if path.startswith('http') else B+path,timeout=60,**kw)
    if r.status_code>=400: print('  !',m,path.split('?')[0],r.status_code,r.text[:300])
    return r
def all_pages(path):
    out=[];url=path
    while url:
        r=req('GET',url); 
        if r.status_code>=400: break
        j=r.json(); out+=j.get('data',[]); url=j.get('links',{}).get('next')
    return out
apps=all_pages(f'/v1/apps?filter[bundleId]={BUNDLE}')
if not apps: sys.exit('App not found for '+BUNDLE)
app=apps[0]; A=app['id']; print('App:',app['attributes']['name'],'| Apple ID',A,'| bundle',app['attributes']['bundleId'])
builds=[b for b in all_pages(f'/v1/builds?filter[app]={A}&filter[expired]=false&limit=200')]
print('Unexpired builds:',len(builds))
groups=all_pages(f'/v1/apps/{A}/betaGroups?limit=200'); print('Beta groups:',len(groups),[g['attributes']['name'] for g in groups])
testers=all_pages(f'/v1/betaTesters?filter[apps]={A}&limit=200'); print('Testers on app:',len(testers))
locs=all_pages(f'/v1/apps/{A}/betaAppLocalizations'); print('Test Information localizations:',len(locs))
if MODE!='apply': print('DRY RUN — nothing changed.'); sys.exit(0)
for i,b in enumerate(builds,1):
    req('PATCH',f'/v1/builds/{b["id"]}',json={'data':{'type':'builds','id':b['id'],'attributes':{'expired':True}}})
    if i%20==0: print('  expired',i)
print('Expired',len(builds),'builds')
for t in testers: req('DELETE',f'/v1/betaTesters/{t["id"]}')
print('Removed',len(testers),'testers')
for g in groups: req('DELETE',f'/v1/betaGroups/{g["id"]}')
print('Deleted',len(groups),'groups')
for l in locs:
    req('PATCH',f'/v1/betaAppLocalizations/{l["id"]}',json={'data':{'type':'betaAppLocalizations','id':l['id'],'attributes':{'description':None,'feedbackEmail':None,'marketingUrl':None,'privacyPolicyUrl':None}}})
print('Cleared Test Information')
r=req('GET',f'/v1/apps/{A}/betaAppReviewDetail')
if r.status_code<400:
    d=r.json()['data']; req('PATCH',f'/v1/betaAppReviewDetails/{d["id"]}',json={'data':{'type':'betaAppReviewDetails','id':d['id'],'attributes':{'contactFirstName':None,'contactLastName':None,'contactPhone':None,'contactEmail':None,'demoAccountName':None,'demoAccountPassword':None,'demoAccountRequired':False,'notes':None}}})
    print('Cleared Beta App Review details')
r=req('GET',f'/v1/apps/{A}/betaLicenseAgreement')
if r.status_code<400:
    d=r.json()['data']; req('PATCH',f'/v1/betaLicenseAgreements/{d["id"]}',json={'data':{'type':'betaLicenseAgreements','id':d['id'],'attributes':{'agreementText':None}}})
left=all_pages(f'/v1/builds?filter[app]={A}&filter[expired]=false&limit=200'); print('Unexpired builds left:',len(left))
