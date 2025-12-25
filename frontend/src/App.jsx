import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Plus, Save, X, Wallet, MessageCircle, CheckCircle2, 
  Bell, UserPlus, ArrowLeft, Users, Trash2, Edit3, Calendar, 
  History, TrendingDown 
} from 'lucide-react';
import axios from 'axios';

function App() {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [vista, setVista] = useState('inicio'); 
  const [mostrarFormPrestamo, setMostrarFormPrestamo] = useState(false);
  const [editandoCli, setEditandoCli] = useState(null);
  const [clienteExpandido, setClienteExpandido] = useState(null);

  // --- DATOS ---
  const [clientes, setClientes] = useState([]);
  const [cartera, setCartera] = useState([]);
  const [cobrosHoy, setCobrosHoy] = useState([]);
  const [historial, setHistorial] = useState([]);
  
  // --- FORMULARIOS ---
  const [nuevoCli, setNuevoCli] = useState({ nombre: '', cedula: '', telefono: '' });
  const [formData, setFormData] = useState({ 
    cliente_id: '', monto_prestado: '', cuotas_totales: '', frecuencia_dias: 8, 
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const [resC, resCob, resCar] = await Promise.all([
        axios.get('http://localhost:3000/api/clientes'),
        axios.get('http://localhost:3000/api/cobros-hoy'),
        axios.get('http://localhost:3000/api/cartera')
      ]);
      setClientes(resC.data);
      setCobrosHoy(resCob.data);
      setCartera(resCar.data);
    } catch (e) { console.error("Error de conexión"); }
  };

  const verHistorial = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/historial/${id}`);
      setHistorial(res.data);
      setClienteExpandido(id === clienteExpandido ? null : id);
    } catch (e) { alert("Error al cargar historial"); }
  };

  // --- ACCIONES CLIENTES ---
  const guardarCliente = async (e) => {
    e.preventDefault();
    try {
      if (editandoCli) {
        await axios.put(`http://localhost:3000/api/clientes/${editandoCli.id}`, nuevoCli);
      } else {
        await axios.post('http://localhost:3000/api/clientes', nuevoCli);
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
        await axios.delete(`http://localhost:3000/api/clientes/${id}`);
        cargarTodo();
      } catch (e) { alert(e.response.data.error); }
    }
  };

  // --- ACCIONES PRÉSTAMOS ---
  const guardarPrestamo = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/prestamos', formData);
      alert("¡Préstamo desembolsado!");
      setMostrarFormPrestamo(false);
      cargarTodo();
    } catch (e) { alert("Error al registrar"); }
  };

  const confirmarPago = async (id, nombre) => {
    if (window.confirm(`¿Confirmar pago de ${nombre}?`)) {
      try {
        await axios.put(`http://localhost:3000/api/pagar-cuota/${id}`);
        cargarTodo();
      } catch (e) { alert("Error al registrar pago"); }
    }
  };

  const interes = formData.monto_prestado * 0.20;
  const totalAPagar = Number(formData.monto_prestado) + interes;
  const valorCuota = formData.cuotas_totales > 0 ? totalAPagar / formData.cuotas_totales : 0;

  return (
    <div className="min-h-screen bg-fondo text-white p-6 font-sans pb-24">
      
      <header className="max-w-md mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-primario italic uppercase tracking-tighter">SmartBank</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Expert Finance v2.0</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setVista('inicio')} className={`p-3 rounded-2xl transition-all ${vista === 'inicio' ? 'bg-primario text-black' : 'bg-slate-800 text-primario'}`}><Bell size={20}/></button>
          <button onClick={() => setVista('cartera')} className={`p-3 rounded-2xl transition-all ${vista === 'cartera' ? 'bg-primario text-black' : 'bg-slate-800 text-primario'}`}><Users size={20}/></button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          
          {/* VISTA: COBROS HOY */}
          {vista === 'inicio' && (
            <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl mb-8 relative">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cobros Pendientes Hoy</p>
                <p className="text-6xl font-black mt-2 text-primario tracking-tighter">{cobrosHoy.length}</p>
                <TrendingDown className="absolute right-8 bottom-8 text-primario/20" size={64} />
              </div>

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold italic text-slate-400">Próximos Cobros</h2>
                <button onClick={() => setMostrarFormPrestamo(true)} className="bg-primario text-black px-6 py-3 rounded-2xl font-black shadow-lg shadow-primario/20 active:scale-95 transition-all text-sm">+ PRESTAR</button>
              </div>

              <div className="space-y-4">
                {cobrosHoy.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-700">
                    <p className="text-slate-500 italic">No tienes cobros para hoy</p>
                  </div>
                ) : (
                  cobrosHoy.map((cobro, i) => (
                    <motion.div key={i} initial={{ x: -20 }} animate={{ x: 0 }} className="bg-slate-800/40 border border-slate-700 p-5 rounded-[2rem] flex justify-between items-center backdrop-blur-sm">
                      <div>
                        <h4 className="font-black text-lg uppercase leading-none mb-1">{cobro.nombre}</h4>
                        <p className="text-primario font-black text-xl tracking-tight">${Number(cobro.monto_cuota).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Cuota #{cobro.numero_cuota}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`https://wa.me/57${cobro.telefono}?text=Hola%20${cobro.nombre},%20cobro%20de%20cuota%20hoy%20por%20$${cobro.monto_cuota}`} target="_blank" className="bg-green-500/20 text-green-500 p-4 rounded-2xl"><MessageCircle size={22}/></a>
                        <button onClick={() => confirmarPago(cobro.id, cobro.nombre)} className="bg-primario text-black p-4 rounded-2xl shadow-lg"><CheckCircle2 size={22}/></button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* VISTA: CARTERA DE CLIENTES */}
          {vista === 'cartera' && (
            <motion.div key="cartera" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Cartera de Clientes</h2>
                <button onClick={() => { setEditandoCli(null); setNuevoCli({nombre:'',cedula:'',telefono:''}); setVista('registrar'); }} className="bg-slate-800 text-primario p-4 rounded-2xl border border-slate-700 shadow-xl"><UserPlus/></button>
              </div>
              <div className="space-y-4">
                {cartera.map((cli, i) => (
                  <div key={i} className="bg-slate-800/60 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black uppercase text-primario tracking-tight">{cli.nombre}</h3>
                        <div className="flex items-center gap-2 text-slate-500">
                           <Calendar size={12}/>
                           <p className="text-[10px] font-bold uppercase">Prestado el: {new Date(cli.fecha_prestamo).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => verHistorial(cli.id)} className="text-slate-400 p-1"><History size={20}/></button>
                        <button onClick={() => { setEditandoCli(cli); setNuevoCli({nombre:cli.nombre, cedula:cli.cedula, telefono:cli.telefono}); setVista('registrar'); }} className="text-slate-400 p-1"><Edit3 size={18}/></button>
                        <button onClick={() => eliminarCliente(cli.id)} className="text-red-500/40 p-1"><Trash2 size={18}/></button>
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

                    {/* ACORDEÓN DE HISTORIAL */}
                    <AnimatePresence>
                      {clienteExpandido === cli.id && (
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
                ))}
              </div>
            </motion.div>
          )}

          {/* VISTA: REGISTRO / EDICIÓN */}
          {vista === 'registrar' && (
            <motion.div key="reg" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setVista('cartera')} className="bg-slate-800 p-3 rounded-2xl"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-black italic uppercase text-primario tracking-tighter">{editandoCli ? 'Actualizar' : 'Registrar'} Cliente</h2>
              </div>
              <form onSubmit={guardarCliente} className="space-y-4">
                <div className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700 space-y-5 shadow-2xl">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">Nombre del deudor</label>
                    <input type="text" required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:border-primario outline-none" value={nuevoCli.nombre} onChange={(e)=>setNuevoCli({...nuevoCli, nombre:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">Cédula / ID</label>
                    <input type="text" required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:border-primario outline-none" value={nuevoCli.cedula} onChange={(e)=>setNuevoCli({...nuevoCli, cedula:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">Teléfono / WhatsApp</label>
                    <input type="text" required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl focus:border-primario outline-none" value={nuevoCli.telefono} onChange={(e)=>setNuevoCli({...nuevoCli, telefono:e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primario text-black py-5 rounded-[2rem] font-black uppercase text-lg shadow-xl shadow-primario/20">Guardar en Base de Datos</button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* MODAL CALCULADORA: AHORA CON FECHA MANUAL */}
        <AnimatePresence>
          {mostrarFormPrestamo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 z-50">
              <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-slate-900 w-full max-w-md p-8 rounded-t-[4rem] sm:rounded-[3rem] border-t border-primario/40 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Desembolso Nuevo</h3>
                  <button onClick={()=>setMostrarFormPrestamo(false)} className="bg-slate-800 p-2 rounded-full"><X size={20}/></button>
                </div>
                <form onSubmit={guardarPrestamo} className="space-y-5">
                  <select required className="w-full bg-slate-800 p-4 rounded-2xl font-bold border border-slate-700 focus:border-primario" onChange={(e)=>setFormData({...formData, cliente_id:e.target.value})}>
                    <option value="">Seleccionar Cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Fecha de inicio</label>
                    <input type="date" required className="w-full bg-transparent text-white font-bold outline-none" value={formData.fecha_inicio} onChange={(e)=>setFormData({...formData, fecha_inicio:e.target.value})} />
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-4 text-2xl font-black text-primario">$</span>
                    <input type="number" required placeholder="0.00" className="w-full bg-slate-800 p-4 pl-10 rounded-2xl text-2xl font-black border border-slate-700" onChange={(e)=>setFormData({...formData, monto_prestado:e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 text-center">
                      <p className="text-[10px] text-slate-500 font-bold mb-1">MONTO + 20%</p>
                      <p className="text-xl font-black text-primario">${totalAPagar.toLocaleString()}</p>
                    </div>
                    <input type="number" required placeholder="N° Cuotas" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-3xl focus:border-primario outline-none font-black text-center" onChange={(e)=>setFormData({...formData, cuotas_totales:e.target.value})} />
                  </div>

                  {formData.monto_prestado > 0 && (
                    <div className="bg-primario/10 p-6 rounded-[2.5rem] text-center border border-primario/20">
                      <p className="text-xs text-primario font-bold uppercase tracking-widest mb-1">Cuota cada 8 días:</p>
                      <p className="text-4xl font-black tracking-tighter">${valorCuota.toLocaleString()}</p>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-primario text-black py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-primario/30">DAR DINERO</button>
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