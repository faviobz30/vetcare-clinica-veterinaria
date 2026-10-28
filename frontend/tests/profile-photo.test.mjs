import test from 'node:test'
import assert from 'node:assert/strict'
import {notifyProfilePhotoChanged} from '../src/lib/profilePhoto.js'
test('invalidación de foto transmite solo identificador y revisión, sin copias ni credenciales',()=>{
 const oldWindow=globalThis.window,oldStorage=globalThis.localStorage,events=[],stored=[]
 globalThis.window={dispatchEvent:event=>events.push(event)}
 globalThis.localStorage={setItem:(key,value)=>stored.push({key,value})}
 try{
  notifyProfilePhotoChanged(18);notifyProfilePhotoChanged(undefined)
  assert.equal(events.length,1);assert.equal(events[0].type,'vetcare:profile-photo-changed')
  const value=JSON.parse(stored[0].value);assert.deepEqual(Object.keys(value).sort(),['id','revision']);assert.equal(value.id,18);assert.equal(typeof value.revision,'number')
  assert.doesNotMatch(stored[0].value,/token|foto|correo|password/i)
 }finally{globalThis.window=oldWindow;globalThis.localStorage=oldStorage}
})
