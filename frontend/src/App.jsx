import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, MessageCircle, CheckCircle2, 
  Bell, UserPlus, ArrowLeft, Users, Trash2, Edit3, Calendar, 
  History, TrendingDown, Wallet, Sparkles 
} from 'lucide-react';
import axios from 'axios';

// --- CONFIGURACIÓN DE URL ---
const API_URL = 'https://banco-maria.onrender.com/api';

// ==========================================
// 1. COMPONENTE: TARJETA DE COBRO (INICIO)
// ==========================================
const TarjetaCobro = ({ cobro, alConfirmar }) => (
  <motion.div 
    initial={{ x: -20, opacity: 0 }} 
    animate={{ x: 0, opacity: 1 }} 
    whileTap={{ scale: 0.98 }}
    className="bg-slate-800/40 border border-slate-700 p-5 rounded-[2.5rem] flex justify-between items-center backdrop-blur-sm shadow-lg mb-4"
  >
    <div>
      <h4 className="font-black text-lg uppercase leading-none mb-1 text-white">{cobro.nombre}</h4>
      <p className="text-primario font-black text-2xl tracking-tight">${Number(cobro.monto_cuota).toLocaleString()}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">
        Cuota #{cobro.numero_cuota} • Vence: {new Date(cobro.fecha_vencimiento).toLocaleDateString()}
      </p>
    </div>
    <div className="flex gap-2">
      <a 
        href={`https://wa.me/57${cobro.telefono}?text=Hola%20${cobro.nombre},%20cobro%20de%20cuota%20hoy%20por%20$${cobro.monto_cuota}`} 
        target="_blank" 
        rel="noreferrer"
        className="bg-green-500/10 text-green-500 p-4 rounded-2xl hover:bg-green-500/20 transition-colors"
      >
        <MessageCircle size={22}/>
      </a>
      <button 
        onClick={() => alConfirmar(cobro.id, cobro.nombre)} 
        className="bg-primario text-black p-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(var(--primario-rgb),0.4)] active:scale-90 transition-transform"
      >
        <CheckCircle2 size={22}/>
      </button>
    </div>
  </motion.div>
);

// ==========================================
// 2. COMPONENTE: TARJETA DE CLIENTE (CARTERA)
// ==========================================
const TarjetaCliente = ({ cli, verHistorial, alEditar, alEliminar, expandido, historial }) => (
  <motion.div 
    layout
    className="bg-slate-800/60 p-6 rounded-[2.8rem] border border-slate-700 shadow-xl mb-4 relative overflow-hidden"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xl font-black uppercase text-primario tracking-tight">{cli.nombre}</h3>
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={12}/>
          <p className="text-[10px] font-bold uppercase tracking-widest">Inició: {new Date(cli.fecha_prestamo).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => verHistorial(cli.id)} className="bg-slate-900/50 p-2 rounded-xl text-slate-400 hover:text-white"><History size={20}/></button>
        <button onClick={() => alEditar(cli)} className="bg-slate-900/50 p-2 rounded-xl text-slate-400 hover:text-white"><Edit3 size={18}/></button>
        <button onClick={() => alEliminar(cli.id)} className="bg-red-500/5 p-2 rounded-xl text-red-500/40 hover:text-red-500"><Trash2 size={18}/></button>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="bg-black/20 p-4 rounded-[2rem] text-center border border-slate-700/30">
        <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-tighter">Saldo Actual</p>
        <p className="font-black text-white text-lg">${Number(cli.total_prestado || 0).toLocaleString()}</p>
      </div>
      <div className="bg-black/20 p-4 rounded-[2rem] text-center border border-slate-700/30">
        <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-tighter">Faltan</p>
        <p className="font-black text-primario text-lg">{cli.cuotas_faltantes || 0} cuotas</p>
      </div>
    </div>

    <AnimatePresence>
      {expandido === cli.id && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }} 
          className="mt-5 pt-5 border-t border-slate-700/50"
        >
          <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Historial de abonos</p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {historial.map((pago, idx) => (
              <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-slate-700/30">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cuota #{pago.numero_cuota}</span>
                <span className="text-green-500 font-black text-sm">${Number(pago.monto_cuota).toLocaleString()}</span>
                <span className="text-[9px] text-slate-600 font-bold">{new Date(pago.fecha_pago_real).toLocaleDateString()}</span>
              </div>
            ))}
            {historial.length === 0 && <p className="text-xs italic text-slate-600 text-center py-2">No hay pagos aún.</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================
function App() {
  const [vista, setVista] = useState('inicio'); 
  const [mostrarFormPrestamo, setMostrarFormPrestamo] = useState(false);
  const [bienvenida, setBienvenida] = useState(true); // Modal de saludo inicial
  const [editandoCli, setEditandoCli] = useState(null);
  const [clienteExpandido, setClienteExpandido] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [cartera, setCartera] = useState([]);
  const [cobrosHoy, setCobrosHoy] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [nuevoCli, setNuevoCli] = useState({ nombre: '', cedula: '', telefono: '' });
  const [formData, setFormData] = useState({ 
    cliente_id: '', monto_prestado: '', cuotas_totales: '', frecuencia_dias: 8, 
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const [resC, resCob, resCar] = await Promise.all([
        axios.get(`${API_URL}/clientes`),
        axios.get(`${API_URL}/cobros-hoy`),
        axios.get(`${API_URL}/cartera`)
      ]);
      setClientes(resC.data);
      setCobrosHoy(resCob.data);
      setCartera(resCar.data);
    } catch (e) { console.error("Error de conexión"); }
  };

  const verHistorial = async (id) => {
    if (clienteExpandido === id) { setClienteExpandido(null); return; }
    try {
      const res = await axios.get(`${API_URL}/historial/${id}`);
      setHistorial(res.data);
      setClienteExpandido(id);
    } catch (e) { alert("Error al cargar historial"); }
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    try {
      if (editandoCli) {
        await axios.put(`${API_URL}/clientes/${editandoCli.id}`, nuevoCli);
      } else {
        await axios.post(`${API_URL}/clientes`, nuevoCli);
      }
      alert("¡Operación exitosa!");
      setNuevoCli({ nombre: '', cedula: '', telefono: '' });
      setEditandoCli(null);
      setVista('cartera');
      cargarTodo();
    } catch (e) { alert("Error al procesar datos"); }
  };

  const eliminarCliente = async (id) => {
    if (window.confirm("¿Seguro? Se borrará el historial solo si no tiene préstamos activos.")) {
      try {
        await axios.delete(`${API_URL}/clientes/${id}`);
        cargarTodo();
      } catch (e) { alert(e.response?.data?.error || "Error al eliminar"); }
    }
  };

  const guardarPrestamo = async (e) => {
    e.preventDefault();
    const confirmar = window.confirm("¿Seguro que quieres hacer el préstamo?");
    if (!confirmar) return;

    try {
      await axios.post(`${API_URL}/prestamos`, formData);
      alert("¡Préstamo desembolsado!");
      setMostrarFormPrestamo(false);
      cargarTodo();
    } catch (e) { alert("Error al registrar"); }
  };

  const confirmarPago = async (id, nombre) => {
    if (window.confirm(`¿Confirmar pago de ${nombre}?`)) {
      try {
        await axios.put(`${API_URL}/pagar-cuota/${id}`);
        cargarTodo();
      } catch (e) { alert("Error al registrar pago"); }
    }
  };

  const totalAPagar = Number(formData.monto_prestado) + (formData.monto_prestado * 0.20);
  const valorCuota = formData.cuotas_totales > 0 ? totalAPagar / formData.cuotas_totales : 0;

  return (
    <div className="min-h-screen bg-fondo text-white p-6 font-sans pb-32">
      
      {/* MODAL DE BIENVENIDA LEGENDARIO */}
      <AnimatePresence>
        {bienvenida && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-primario/30 p-10 rounded-[3.5rem] text-center shadow-[0_0_50px_rgba(var(--primario-rgb),0.2)] max-w-xs w-full"
            >
              <div className="bg-primario/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primario/20">
                <Sparkles className="text-primario" size={40} />
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter mb-2">¡Hola Maria!</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">Tu banco está listo</p>
              <button 
                onClick={() => setBienvenida(false)}
                className="w-full bg-primario text-black py-5 rounded-3xl font-black text-lg shadow-xl shadow-primario/20 active:scale-95 transition-all"
              >
                ENTRAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER TIPO IPHONE */}
      <header className="max-w-md mx-auto flex justify-between items-center mb-10 sticky top-0 py-4 bg-fondo/80 backdrop-blur-md z-40">
        <div>
          <h1 className="text-4xl font-black text-primario italic uppercase tracking-tighter leading-none">SmartBank</h1>
          <p className="text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase">Private Banking v2.0</p>
        </div>
        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-800">
          <button onClick={() => setVista('inicio')} className={`p-3 rounded-2xl transition-all ${vista === 'inicio' ? 'bg-primario text-black shadow-lg shadow-primario/20' : 'text-slate-500'}`}><Bell size={22}/></button>
          <button onClick={() => setVista('cartera')} className={`p-3 rounded-2xl transition-all ${vista === 'cartera' ? 'bg-primario text-black shadow-lg shadow-primario/20' : 'text-slate-500'}`}><Users size={22}/></button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          
          {/* VISTA: INICIO */}
          {vista === 'inicio' && (
            <motion.div key="inicio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-9 rounded-[3rem] border border-slate-700/50 shadow-2xl mb-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primario/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primario/20 transition-all" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Pendientes Hoy</p>
                <p className="text-7xl font-black text-primario tracking-tighter">{cobrosHoy.length}</p>
                <TrendingDown className="absolute right-8 bottom-8 text-primario/10" size={80} />
              </div>

              <div className="flex justify-between items-end mb-8 px-2">
                <h2 className="text-2xl font-black italic uppercase text-white/90 leading-none">Agenda de Cobro</h2>
                <button 
                  onClick={() => setMostrarFormPrestamo(true)} 
                  className="bg-primario text-black px-8 py-4 rounded-[2rem] font-black text-xs uppercase shadow-xl shadow-primario/20 active:scale-95 transition-all"
                >
                  + Prestar
                </button>
              </div>

              <div className="space-y-2">
                {cobrosHoy.length === 0 ? (
                  <div className="text-center py-20 bg-slate-800/20 rounded-[3rem] border border-dashed border-slate-700/50">
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Todo al día por hoy</p>
                  </div>
                ) : (
                  cobrosHoy.map((c) => <TarjetaCobro key={c.id} cobro={c} alConfirmar={confirmarPago} />)
                )}
              </div>
            </motion.div>
          )}

          {/* VISTA: CARTERA */}
          {vista === 'cartera' && (
            <motion.div key="cartera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Cartera Total</h2>
                <button 
                  onClick={() => { setEditandoCli(null); setNuevoCli({nombre:'',cedula:'',telefono:''}); setVista('registrar'); }} 
                  className="bg-slate-800 text-primario p-4 rounded-[1.8rem] border border-slate-700 shadow-xl"
                >
                  <UserPlus size={24}/>
                </button>
              </div>
              <div className="space-y-2">
                {cartera.map((cli) => (
                  <TarjetaCliente 
                    key={cli.id} 
                    cli={cli} 
                    verHistorial={verHistorial} 
                    alEditar={(c) => { setEditandoCli(c); setNuevoCli({nombre:c.nombre, cedula:c.cedula, telefono:c.telefono}); setVista('registrar'); }}
                    alEliminar={eliminarCliente}
                    expandido={clienteExpandido}
                    historial={historial}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* VISTA: REGISTRO CLIENTE */}
          {vista === 'registrar' && (
            <motion.div key="reg" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>
              <div className="flex items-center gap-4 mb-10 px-2">
                <button onClick={() => setVista('cartera')} className="bg-slate-800 p-4 rounded-2xl text-primario shadow-lg"><ArrowLeft/></button>
                <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">{editandoCli ? 'Actualizar' : 'Nuevo'} Deudor</h2>
              </div>
              
              <form onSubmit={guardarCliente} className="bg-slate-800/80 p-9 rounded-[3.5rem] border border-slate-700/50 space-y-7 shadow-2xl backdrop-blur-xl mx-2">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nombre Completo</label>
                    <input type="text" placeholder="..." required className="w-full bg-slate-900/50 border-2 border-slate-700 p-5 rounded-2xl focus:border-primario outline-none transition-all font-bold text-white" value={nuevoCli.nombre} onChange={(e)=>setNuevoCli({...nuevoCli, nombre:e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Documento de Identidad</label>
                    <input type="text" placeholder="..." required className="w-full bg-slate-900/50 border-2 border-slate-700 p-5 rounded-2xl focus:border-primario outline-none transition-all font-bold text-white" value={nuevoCli.cedula} onChange={(e)=>setNuevoCli({...nuevoCli, cedula:e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">WhatsApp / Celular</label>
                    <input type="text" placeholder="..." required className="w-full bg-slate-900/50 border-2 border-slate-700 p-5 rounded-2xl focus:border-primario outline-none transition-all font-bold text-white" value={nuevoCli.telefono} onChange={(e)=>setNuevoCli({...nuevoCli, telefono:e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-primario text-black py-6 rounded-[2.5rem] font-black uppercase text-xl shadow-2xl shadow-primario/20 active:scale-95 transition-all">
                  {editandoCli ? 'Actualizar Datos' : 'Registrar en Base'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* MODAL PRÉSTAMO OPTIMIZADO PARA MÓVIL */}
        <AnimatePresence>
          {mostrarFormPrestamo && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-end justify-center z-50"
            >
              <div className="absolute inset-0" onClick={() => setMostrarFormPrestamo(false)} />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative bg-slate-900 w-full max-w-md p-6 pb-12 rounded-t-[3.5rem] border-t border-primario/30 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8" />
                <div className="flex justify-between items-start mb-8 px-4">
                  <div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Desembolso</h3>
                    <p className="text-[10px] text-primario font-bold uppercase tracking-[0.2em]">Cálculo de Capital</p>
                  </div>
                  <button onClick={() => setMostrarFormPrestamo(false)} className="bg-slate-800 p-3 rounded-full text-white">
                    <X size={20}/>
                  </button>
                </div>
                <form onSubmit={guardarPrestamo} className="space-y-6 px-4">
                  <div className="relative">
                    <label className="absolute -top-2 left-4 bg-slate-900 px-2 text-[10px] font-bold text-slate-500 uppercase z-10">Seleccionar Deudor</label>
                    <select required className="w-full bg-slate-800/40 border-2 border-slate-700 p-4 rounded-2xl font-bold text-white focus:border-primario outline-none appearance-none" onChange={(e)=>setFormData({...formData, cliente_id:e.target.value})}>
                      <option value="">Buscar en cartera...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="absolute -top-2 left-4 bg-slate-900 px-2 text-[10px] font-bold text-slate-500 uppercase z-10">Fecha</label>
                      <input type="date" required className="w-full bg-slate-800/40 border-2 border-slate-700 p-4 rounded-2xl font-bold text-white outline-none" value={formData.fecha_inicio} onChange={(e)=>setFormData({...formData, fecha_inicio:e.target.value})} />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-4 bg-slate-900 px-2 text-[10px] font-bold text-slate-500 uppercase z-10">Cuotas</label>
                      <input type="number" placeholder="0" required className="w-full bg-slate-800/40 border-2 border-slate-700 p-4 rounded-2xl font-black text-center text-white focus:border-primario outline-none" onChange={(e)=>setFormData({...formData, cuotas_totales:e.target.value})} />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-2 left-4 bg-slate-900 px-2 text-[10px] font-bold text-slate-500 uppercase z-10">Monto Principal</label>
                    <div className="flex items-center bg-slate-800/40 border-2 border-slate-700 rounded-[2rem] p-2 focus-within:border-primario transition-all">
                      <span className="pl-4 text-3xl font-black text-primario">$</span>
                      <input type="number" placeholder="0" required className="w-full bg-transparent p-4 text-4xl font-black text-white outline-none" onChange={(e)=>setFormData({...formData, monto_prestado:e.target.value})} />
                    </div>
                  </div>
                  {formData.monto_prestado > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primario/10 border border-primario/20 p-6 rounded-[2.5rem]">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-primario/10">
                        <p className="text-[10px] font-black text-primario/60 uppercase tracking-widest">Total a Devolver</p>
                        <p className="text-2xl font-black text-white">${totalAPagar.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-primario/60 uppercase tracking-widest">Cuota (8d)</p>
                        <p className="text-2xl font-black text-primario">${valorCuota.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  )}
                  <button type="submit" className="w-full bg-primario text-black py-6 rounded-[2.5rem] font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <Wallet size={24} /> DAR DINERO
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;