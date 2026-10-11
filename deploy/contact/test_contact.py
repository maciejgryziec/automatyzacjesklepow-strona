# -*- coding: utf-8 -*-
"""Functional tests for isolated e-commerce contact sidecar. No real SMTP."""
import io, json, os, tempfile, unittest, sys, uuid
from pathlib import Path
from unittest.mock import Mock
sys.path.insert(0,str(Path(__file__).resolve().parent))
from app import Contact, ORIGIN, MAILBOX, validate, Invalid

class ContactTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.addCleanup(self.tmp.cleanup)
  self.now=1728401000.0
  self.deliver=Mock()
  self.mailcfg=Path(self.tmp.name)/'smtp.json'
  self.mailcfg.write_text(json.dumps({'user':MAILBOX,'password':'DUMMY_DO_NOT_USE','verified':True}))
  self.contact=Contact(Path(self.tmp.name)/'contact.db',b'k'*48,str(self.mailcfg),sender=self.deliver,clock=lambda:self.now)
 def do(self,path='/api/contact/session',method='GET',data=None,origin=None,ip='203.0.113.5',headers=None):
  headers=headers or {}
  env={'REQUEST_METHOD':method,'PATH_INFO':path,'REMOTE_ADDR':ip,'HTTP_X_CONTACT_CLIENT_IP':ip,'HTTP_SEC_FETCH_SITE':'same-origin'}
  if origin is not None:env['HTTP_ORIGIN']=origin
  for k,v in headers.items():env[k]=v
  if data is not None:
   binary=json.dumps(data,ensure_ascii=False).encode('utf-8')
   env['CONTENT_TYPE']='application/json';env['CONTENT_LENGTH']=str(len(binary));env['wsgi.input']=io.BytesIO(binary)
  captured={}
  def start(status,head):captured['status']=status;captured['headers']=dict(head)
  result=json.loads(b''.join(self.contact(env,start)))
  return int(captured['status'].split(' ')[0]),result,captured['headers']
 def valid(self):
  return {'imie':'Testowy Odbiorca','email':'customer@example.org','firma':'Test Sp. z o.o.','telefon':'','typ':'Integracja systemów','dzis':'Dane przechodzą ręcznie z zamówień Allegro do arkusza i księgowości.',
   'problem':'Chcę uporządkować dane i uniknąć ponownego przepisywania.', 'narzedzia':'Allegro i Fakturownia','uzytkownicy':'','budzet':'3 000–8 000 zł','efekt':'','zrodlo':'utm_source=demo | path=/opisz-projekt.html','website':'','request_id':str(uuid.uuid4())}
 def issue(self):
  st,content,_=self.do()
  self.assertEqual(st,200);self.assertTrue(content['ready'])
  self.now+=3
  return content['token']
 def test_domain_scope_and_validated_email(self):
  self.assertEqual(ORIGIN,'https://automatyzacjesklepow.pl')
  self.assertEqual(MAILBOX,'kontakt@maciejgryziec.pl')
  with self.assertRaises(Invalid):validate({'email':'abc'})
 def test_token_requires_two_seconds(self):
  st,res,_=self.do();token=res['token']
  payload=self.valid()|{'token':token}
  st,_,_=self.do(method='POST',path='/api/contact',origin=ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'},data=payload)
  self.assertEqual(st,400)
  self.now+=3
  st,result,_=self.do(method='POST',path='/api/contact',origin=ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'},data=payload)
  self.assertEqual(st,200);self.assertEqual(result['status'],'sent')
  self.deliver.assert_called_once()
 def test_cross_origin_rejected(self):
  tok=self.issue()
  payload=self.valid()|{'token':tok}
  for origin in ('https://evil.test','https://maciejgryziec.pl',None):
   st,_,_=self.do('/api/contact','POST',payload,origin,headers={'HTTP_X_CONTACT_FORM':'1'})
   self.assertEqual(st,403)
  self.deliver.assert_not_called()
 def test_honeypot_and_duplicate_replay(self):
  tok=self.issue()
  payload=self.valid()|{'token':tok}
  s,r,_=self.do('/api/contact','POST',payload,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
  self.assertEqual(s,200)
  s,r,_=self.do('/api/contact','POST',payload,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
  self.assertEqual(s,200)
  self.deliver.assert_called_once()
  dirty=payload|{'problem':'Nowa treść'}
  s,r,_=self.do('/api/contact','POST',dirty,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
  self.assertEqual(s,409)
  dirty=payload|{'request_id':str(uuid.uuid4()),'website':'spambot.example'}
  s,_,_=self.do('/api/contact','POST',dirty,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
  self.assertEqual(s,400)
 def test_no_token_or_header(self):
  payload=self.valid()
  s,_,_=self.do('/api/contact','POST',payload,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
  self.assertEqual(s,400)
  tok=self.issue()
  payload=payload|{'token':tok}
  s,_,_=self.do('/api/contact','POST',payload,ORIGIN)
  self.assertEqual(s,403)
 def test_rate_limit(self):
  tok=self.issue()
  for i in range(4):
   payload=self.valid()|{'token':tok}
   s,_,_=self.do('/api/contact','POST',payload,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
   if i<3:self.assertEqual(s,200)
   else:self.assertEqual(s,429)
  self.assertEqual(self.deliver.call_count,3)
 def test_private_legal_reply_to(self):
  tok=self.issue()
  payload=self.valid()|{'token':tok}
  s,_,_=self.do('/api/contact','POST',payload,ORIGIN,headers={'HTTP_X_CONTACT_FORM':'1'})
  self.assertEqual(s,200)
  data,request_id,cfg=self.deliver.call_args.args
  self.assertEqual(data['email'],'customer@example.org')
  self.assertIn('utm_source',data['zrodlo'])
  self.assertEqual(cfg['user'],MAILBOX)
if __name__=='__main__':unittest.main()
