import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, MessageCircle, CheckCircle2, 
  Bell, UserPlus, ArrowLeft, Users, Trash2, Edit3, Calendar, 
  History, TrendingDown 
} from 'lucide-react';
import axios from 'axios';

// --- CONFIGURACIÓN DE URL ---
const API_URL = 'https://banco-maria.onrender.com/api';

// ==========================================
// 1. COMPONENTE: TARJETA DE COBRO (INICIO)
// ==========================================
const TarjetaCobro = ({ cobro, alConfirmar }) => (
  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-800/40 border border-slate-700 p-5 rounded-[2rem] flex justify-between items-center backdrop-blur-sm">
    <div>
      <h4 className="font-black text-lg uppercase leading-none mb-1">{cobro.nombre}</h4>
      <p className="text-primario font-black text-xl tracking-tight">${Number(cobro.monto_cuota).toLocaleString()}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Cuota #{cobro.numero_cuota} • Vence: {new Date(cobro.fecha_vencimiento).toLocaleDateString()}</p>
    </div>
    <div className="flex gap-2">
      <a href={`https://wa.me/57${cobro.telefono}?text=Hola%20${cobro.nombre},%20cobro%20de%20cuota%20hoy%20por%20$${cobro.monto_cuota}`} target="_blank" className="bg-green-500/20 text-green-500 p-4 rounded-2xl"><MessageCircle size={22}/></a>
      <button onClick={() => alConfirmar(cobro.id, cobro.nombre)} className="bg-primario text-black p-4 rounded-2xl shadow-lg"><CheckCircle2 size={22}/></button>
    </div>
  </motion.div>
);

// ==========================================
// 2. COMPONENTE: TARJETA DE CLIENTE (CARTERA)
// ==========================================
const TarjetaCliente = ({ cli, verHistorial, alEditar, alEliminar, expandido, historial }) => (
  <div className="bg-slate-800/60 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xl font-black uppercase text-primario tracking-tight">{cli.nombre}</h3>
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={12}/><p className="text-[10px] font-bold uppercase">Prestado el: {new Date(cli.fecha_prestamo).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => verHistorial(cli.id)} className="text-slate-400 p-1"><History size={20}/></button>
        <button onClick={() => alEditar(cli)} className="text-slate-400 p-1"><Edit3 size={18}/></button>
        <button onClick={() => alEliminar(cli.id)} className="text-red-500/40 p-1"><Trash2 size={18}/></button>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="bg-slate-900/50 p-4 rounded-3xl text-center border border-slate-700/50">
        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Saldo Vivo</p>
        <p className="font-black text-white text-lg">${Number(cli.total_prestado || 0).toLocaleString()}</p>
      </div>
      <div className="bg-slate-900/50 p-4 rounded-3xl text-center border border-slate-700/50">
        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Pendientes</p>
        <p className="font-black text-primario text-lg">{cli.cuotas_faltantes || 0} cuotas</p>
      </div>
    </div>

    <AnimatePresence>
      {expandido === cli.id && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden border-t border-slate-700 pt-4">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Historial de abonos</p>
          <div className="space-y-2">
            {historial.map((pago, idx) => (
              <div key={idx} className="flex justify-between text-xs bg-slate-900/30 p-2 rounded-xl border border-slate-700/30">
                <span className="text-slate-400 font-bold">Cuota #{pago.numero_cuota}</span>
                <span className="text-green-500 font-black">${Number(pago.monto_cuota).toLocaleString()}</span>
                <span className="text-slate-500">{new Date(pago.fecha_pago_real).toLocaleDateString()}</span>
              </div>
            ))}
            {historial.length === 0 && <p className="text-[10px] italic text-slate-600">No hay pagos registrados aún.</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================
function App() {
  const [vista, setVista] = useState('inicio'); 
  const [mostrarFormPrestamo, setMostrarFormPrestamo] = useState(false);
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
      } catch (e) { alert(e.response.data.error); }
    }
  };

 const guardarPrestamo = async (e) => {
    e.preventDefault();

    // Esta es la alerta que pediste
    const confirmar = window.confirm("¿Seguro que quieres hacer el préstamo?");
    
    if (confirmar) {
      try {
        await axios.post('https://banco-maria.onrender.com/api/prestamos', formData);
        alert("¡Préstamo desembolsado!");
        setMostrarFormPrestamo(false);
        cargarTodo();
      } catch (e) { 
        alert("Error al registrar"); 
      }
    } else {
      // Si dice que no, no hace nada y se queda en el formulario
      console.log("Acción cancelada");
    }
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
    <div className="min-h-screen bg-fondo text-white p-6 font-sans pb-24">
      {/* HEADER */}
      <header className="max-w-md mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-primario italic uppercase tracking-tighter">SmartBank</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Expert Finance v2.0</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setVista('inicio')} className={`p-3 rounded-2xl ${vista === 'inicio' ? 'bg-primario text-black' : 'bg-slate-800 text-primario'}`}><Bell size={20}/></button>
          <button onClick={() => setVista('cartera')} className={`p-3 rounded-2xl ${vista === 'cartera' ? 'bg-primario text-black' : 'bg-slate-800 text-primario'}`}><Users size={20}/></button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          
          {/* VISTA: INICIO */}
          {vista === 'inicio' && (
            <motion.div key="inicio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] border border-slate-700 mb-8 relative">
                <p className="text-slate-400 text-xs font-bold uppercase">Cobros Pendientes Hoy</p>
                <p className="text-6xl font-black mt-2 text-primario">{cobrosHoy.length}</p>
                <TrendingDown className="absolute right-8 bottom-8 text-primario/20" size={64} />
              </div>

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold italic text-slate-400">Próximos Cobros</h2>
                <button onClick={() => setMostrarFormPrestamo(true)} className="bg-primario text-black px-6 py-3 rounded-2xl font-black text-sm">+ PRESTAR</button>
              </div>

              <div className="space-y-4">
                {cobrosHoy.length === 0 ? (
                  <p className="text-center py-12 text-slate-500 italic bg-slate-800/20 rounded-[2rem]">No tienes cobros pendientes</p>
                ) : (
                  cobrosHoy.map((c) => <TarjetaCobro key={c.id} cobro={c} alConfirmar={confirmarPago} />)
                )}
              </div>
            </motion.div>
          )}

          {/* VISTA: CARTERA */}
          {vista === 'cartera' && (
            <motion.div key="cartera" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase">Cartera</h2>
                <button onClick={() => { setEditandoCli(null); setNuevoCli({nombre:'',cedula:'',telefono:''}); setVista('registrar'); }} className="bg-slate-800 text-primario p-4 rounded-2xl"><UserPlus/></button>
              </div>
              <div className="space-y-4">
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

          {/* VISTA: REGISTRO */}
          {vista === 'registrar' && (
            <motion.div key="reg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => setVista('cartera')} className="bg-slate-800 p-3 rounded-2xl mb-6"><ArrowLeft size={20}/></button>
              <form onSubmit={guardarCliente} className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700 space-y-5">
                <input type="text" placeholder="Nombre" required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl" value={nuevoCli.nombre} onChange={(e)=>setNuevoCli({...nuevoCli, nombre:e.target.value})} />
                <input type="text" placeholder="Cédula" required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl" value={nuevoCli.cedula} onChange={(e)=>setNuevoCli({...nuevoCli, cedula:e.target.value})} />
                <input type="text" placeholder="Teléfono" required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl" value={nuevoCli.telefono} onChange={(e)=>setNuevoCli({...nuevoCli, telefono:e.target.value})} />
                <button type="submit" className="w-full bg-primario text-black py-5 rounded-[2rem] font-black uppercase">Guardar Cliente</button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* MODAL PRÉSTAMO */}
        <AnimatePresence>
          {mostrarFormPrestamo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-end justify-center p-4 z-50">
              <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-slate-900 w-full max-w-md p-8 rounded-t-[4rem] border-t border-primario/40">
                <div className="flex justify-between mb-8"><h3 className="text-2xl font-black italic">Nuevo Préstamo</h3><button onClick={()=>setMostrarFormPrestamo(false)}><X/></button></div>
                <form onSubmit={guardarPrestamo} className="space-y-5">
                  <select required className="w-full bg-slate-800 p-4 rounded-2xl font-bold" onChange={(e)=>setFormData({...formData, cliente_id:e.target.value})}>
                    <option value="">Seleccionar Cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <input type="date" required className="w-full bg-slate-800 p-4 rounded-2xl font-bold" value={formData.fecha_inicio} onChange={(e)=>setFormData({...formData, fecha_inicio:e.target.value})} />
                  <input type="number" placeholder="Monto" required className="w-full bg-slate-800 p-4 rounded-2xl text-2xl font-black text-primario" onChange={(e)=>setFormData({...formData, monto_prestado:e.target.value})} />
                  <input type="number" placeholder="Cuotas" required className="w-full bg-slate-800 p-4 rounded-2xl font-black text-center" onChange={(e)=>setFormData({...formData, cuotas_totales:e.target.value})} />
                  <button type="submit" className="w-full bg-primario text-black py-5 rounded-[2.5rem] font-black text-xl">DESEMBOLSAR</button>
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