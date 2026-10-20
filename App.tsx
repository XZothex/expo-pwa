import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth, db, firebaseConfigured } from './src/firebase';

type Registro = { id: string; nome: string; descricao: string };
const collectionName = 'registros';

export default function App() {
  const [screen, setScreen] = useState<'form' | 'list'>('form');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [items, setItems] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) { manifest = document.createElement('link'); manifest.setAttribute('rel', 'manifest'); document.head.appendChild(manifest); }
    manifest.setAttribute('href', '/manifest.webmanifest');
    if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(console.warn); }, { once: true });
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        setUser(currentUser);
        setAuthLoading(false);
      } else {
        setUser(null);
        setAuthLoading(true);
        void signInAnonymously(auth).catch(error => {
          setMessage('Falha na autenticação: ' + error.message);
          setAuthLoading(false);
        });
      }
    }, error => {
      setMessage('Erro de autenticação: ' + error.message);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!db || !user) { setItems([]); return; }
    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, collectionName), where('ownerUid', '==', user.uid)),
      snapshot => {
        setItems(snapshot.docs.map(item => ({ id: item.id, nome: String(item.data().nome ?? ''), descricao: String(item.data().descricao ?? '') })));
        setLoading(false);
      },
      error => { setMessage('Erro ao consultar Firestore: ' + error.message); setLoading(false); }
    );
    return unsubscribe;
  }, [user]);

  const save = async () => {
    if (!nome.trim() || !descricao.trim()) { setMessage('Preencha Nome e Descrição.'); return; }
    if (!db || !user) { setMessage('Aguarde a autenticação do Firebase para salvar.'); return; }
    if (nome.trim().length > 120 || descricao.trim().length > 2000) { setMessage('Limite: 120 caracteres no nome e 2000 na descrição.'); return; }
    setBusy(true); setMessage('');
    try {
      if (editing) await updateDoc(doc(db, collectionName, editing), { nome: nome.trim(), descricao: descricao.trim() });
      else await addDoc(collection(db, collectionName), { nome: nome.trim(), descricao: descricao.trim(), criadoEm: serverTimestamp(), ownerUid: user.uid });
      setNome(''); setDescricao(''); setEditing(null); setMessage('Registro salvo com sucesso!'); setScreen('list');
    } catch (error) { setMessage('Falha ao salvar: ' + (error instanceof Error ? error.message : String(error))); }
    finally { setBusy(false); }
  };
  const edit = (item: Registro) => { setNome(item.nome); setDescricao(item.descricao); setEditing(item.id); setMessage(''); setScreen('form'); };
  const remove = (item: Registro) => {
    const execute = async () => {
      if (!db || !user) return;
      setBusy(true);
      try { await deleteDoc(doc(db, collectionName, item.id)); setMessage('Registro excluído.'); }
      catch (error) { setMessage('Falha ao excluir: ' + (error instanceof Error ? error.message : String(error))); }
      finally { setBusy(false); }
    };
    if (Platform.OS === 'web') { if (window.confirm('Excluir ' + item.nome + '?')) void execute(); }
    else Alert.alert('Excluir registro', 'Excluir ' + item.nome + '?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void execute() }]);
  };
  const Button = ({ label, onPress, secondary = false, disabled = false }: {label: string; onPress: () => void; secondary?: boolean; disabled?: boolean}) =>
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.card}>
      <Text style={styles.title}>Expo PWA + Firebase</Text>
      <Text style={styles.subtitle}>CRUD de registros · {screen === 'form' ? 'Formulário' : 'Listagem'}</Text>
      {!firebaseConfigured && <Text style={styles.warning}>Firebase ainda não configurado. Preencha as variáveis EXPO_PUBLIC_FIREBASE_* para ativar o CRUD.</Text>}
      {authLoading && <Text style={styles.subtitle}>Autenticando no Firebase...</Text>}
      <View style={styles.nav}><Button label="Formulário" secondary={screen !== 'form'} onPress={() => setScreen('form')} /><Button label="Listagem" secondary={screen !== 'list'} onPress={() => setScreen('list')} /></View>
      {screen === 'form' ? <>
        <Text style={styles.heading}>{editing ? 'Editar registro' : 'Novo registro'}</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput accessibilityLabel="Nome" placeholder="Digite o nome" style={styles.input} value={nome} onChangeText={setNome} />
        <Text style={styles.label}>Descrição</Text>
        <TextInput accessibilityLabel="Descrição" placeholder="Digite a descrição" style={[styles.input, styles.multiline]} multiline value={descricao} onChangeText={setDescricao} />
        <Button label={busy ? 'Salvando...' : editing ? 'Atualizar' : 'Salvar'} disabled={busy || !db || !user || authLoading} onPress={() => void save()} />
        {editing && <Button label="Cancelar edição" secondary onPress={() => { setEditing(null); setNome(''); setDescricao(''); }} />}
      </> : <>
        <Text style={styles.heading}>Registros ({items.length})</Text>
        {loading ? <ActivityIndicator /> : !items.length ? <Text style={styles.empty}>Nenhum registro encontrado.</Text> :
          items.map(item => <View key={item.id} style={styles.item}><Text style={styles.itemTitle}>{item.nome}</Text><Text style={styles.description}>{item.descricao}</Text><View style={styles.actions}><Button label="Editar" secondary onPress={() => edit(item)} /><Button label="Excluir" secondary disabled={busy} onPress={() => remove(item)} /></View></View>)}
      </>}
      {!!message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
    </View>
    <StatusBar style="auto" />
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#f1f5f9'},content:{flexGrow:1,justifyContent:'center',padding:20},
  card:{backgroundColor:'#fff',borderRadius:18,padding:24,width:'100%',maxWidth:620,alignSelf:'center'},
  title:{fontSize:27,fontWeight:'800',color:'#0f172a'},subtitle:{fontSize:15,color:'#64748b',marginTop:6,marginBottom:20},
  warning:{backgroundColor:'#fef3c7',color:'#92400e',padding:12,borderRadius:8,marginBottom:16},
  nav:{flexDirection:'row',gap:10,marginBottom:20,flexWrap:'wrap'},heading:{fontSize:20,fontWeight:'700',marginBottom:14,color:'#0f172a'},
  label:{fontSize:14,fontWeight:'600',marginBottom:6,color:'#334155'},input:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:9,padding:12,fontSize:16,marginBottom:14,color:'#0f172a'},
  multiline:{minHeight:92,textAlignVertical:'top'},button:{backgroundColor:'#2563eb',paddingVertical:12,paddingHorizontal:18,borderRadius:9,alignItems:'center',marginBottom:8},
  secondary:{backgroundColor:'#e2e8f0'},disabled:{opacity:.5},buttonText:{color:'#fff',fontWeight:'700'},secondaryText:{color:'#1e293b'},
  item:{borderWidth:1,borderColor:'#e2e8f0',borderRadius:10,padding:14,marginBottom:12},itemTitle:{fontSize:17,fontWeight:'700',color:'#0f172a'},
  description:{fontSize:15,color:'#475569',marginVertical:8},actions:{flexDirection:'row',gap:8,flexWrap:'wrap'},empty:{color:'#64748b',paddingVertical:16},message:{color:'#334155',marginTop:14}
});
