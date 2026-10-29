'use strict';

/* =====================================================================
   1. Referencias a los elementos del HTML
   ===================================================================== */
const canvas = document.getElementById('cancha');
const ctxPrincipal = canvas.getContext('2d');
let ctx = ctxPrincipal; // casi siempre dibuja en el canvas del juego; a veces en el fondo guardado

const pantalla = document.getElementById('pantalla');
const pantallaTitulo = document.getElementById('pantallaTitulo');
const pantallaTexto = document.getElementById('pantallaTexto');
const imagenFinal = document.getElementById('imagenFinal');
const formulario = document.getElementById('formulario');
const campoNombre = document.getElementById('nombre');
const campoNombre2 = document.getElementById('nombre2');
const campoJugador2 = document.getElementById('campoJugador2');
const etiquetaNombre1 = document.getElementById('etiquetaNombre1');
const botonJugar = document.getElementById('botonJugar');

const etiquetaJugador = document.getElementById('etiquetaJugador');
const etiquetaMaquina = document.getElementById('etiquetaMaquina');
const etiquetaCentro = document.getElementById('etiquetaCentro');
const listaVidas = document.getElementById('listaVidas');
const marcadorJugador = document.getElementById('puntosJugador');
const marcadorMaquina = document.getElementById('puntosMaquina');
const vidas = document.querySelectorAll('.vida');
const intentosTexto = document.getElementById('intentosTexto');
const botonSonido = document.getElementById('botonSonido');
const botonPantalla = document.getElementById('botonPantalla');
const festejo = document.getElementById('festejo');
const burla = document.getElementById('burla');
const anuncio = document.getElementById('anuncio');
const botonMenu = document.getElementById('botonMenu');
const menu = document.getElementById('menu');
const botonContinuar = document.getElementById('botonContinuar');
const botonReiniciar = document.getElementById('botonReiniciar');
const botonSalir = document.getElementById('botonSalir');

// Textos originales de la ventana de inicio (para volver a ellos al salir)
const TITULO_INICIO = pantallaTitulo.textContent;
const TEXTO_INICIO = pantallaTexto.textContent;

// Si la persona pidió menos movimiento en su dispositivo, quitamos sacudida, saltos y parpadeos
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// En celulares y tablets se dibuja sin brillos: es lo que más pone lento el canvas
const ligero = window.matchMedia('(pointer: coarse)').matches;
const MAX_PARTICULAS = ligero ? 220 : 450; // tope de chispas en pantalla

/* =====================================================================
   2. Configuración
   ===================================================================== */
// El canvas mide 1000 x 500: 800 de cancha en el centro y 100 de gradería a cada lado
const GRADERIA = 100;
const ANCHO_LIENZO = 1000;                  // largo total: cancha + 2 graderías
const ANCHO = ANCHO_LIENZO - GRADERIA * 2;  // largo de la cancha donde se juega
const ALTO = 500;                           // ancho de la cancha (de borde a borde)

// Marca que hay que volver a medir el canvas (se usa al girar el celular)
function cajaCanvasVieja() {
  if (typeof medirCanvas === 'function') requestAnimationFrame(() => medirCanvas());
}

// Celular vertical: la cancha se dibuja girada (tu canasta abajo, Petunia arriba)
const consultaVertical = window.matchMedia('(orientation: portrait) and (max-width: 700px)');
let vertical = false;

function aplicarOrientacion() {
  vertical = consultaVertical.matches;
  cajaCanvasVieja();
  // El canvas se acuesta o se para; el juego por dentro sigue igual
  canvas.width = vertical ? ALTO : ANCHO_LIENZO;
  canvas.height = vertical ? ANCHO_LIENZO : ALTO;
}
const META = 5;          // gana el primero que llegue a 5 puntos (en los dos modos)
const INTENTOS = META;   // contra Petunia: si ella llega a 5, se acaban tus intentos
const MS_POR_CUADRO = 16.67;
const NOMBRE_MAQUINA = 'Petunia';
const CLAVE_USUARIO = 'pingpong-usuario';    // para recordar los usuarios la próxima vez
const CLAVE_USUARIO_2 = 'pingpong-usuario-2';
const TEXTO_MAQUINA = document.getElementById('etiquetaMaquina').textContent.trim(); // "Petunia la pro"

// Los colores se leen del CSS para no repetirlos aquí
const estilos = getComputedStyle(document.documentElement);
const leerColor = (nombre) => estilos.getPropertyValue(nombre).trim();
const COLORES = {
  jugador: leerColor('--color-jugador'),
  maquina: leerColor('--color-maquina'),
  pelota: leerColor('--color-pelota'),
  costura: leerColor('--color-costura'),
  contorno: leerColor('--color-contorno'),
  piso: leerColor('--color-piso'),
  pisoTabla: leerColor('--color-piso-tabla'),
  lineas: leerColor('--color-lineas'),
  aro: leerColor('--color-aro'),
  borde: leerColor('--color-borde'),
  graderia: leerColor('--color-graderia'),
  graderiaEscalon: leerColor('--color-graderia-escalon'),
  celador: leerColor('--color-celador'),
  chaleco: leerColor('--color-chaleco'),
  dron: leerColor('--color-dron'),
  botella: leerColor('--color-botella'),
  aseo: leerColor('--color-aseo'),
  cesped: leerColor('--futbol-cesped'),
  cespedFranja: leerColor('--futbol-cesped-franja'),
  hielo: leerColor('--hockey-mesa'),
  hoyitos: leerColor('--hockey-hoyitos'),
  hockeyRojo: leerColor('--hockey-rojo'),
  hockeyAzul: leerColor('--hockey-azul'),
  baranda: leerColor('--hockey-baranda'),
  graderiaFutbol: leerColor('--graderia-futbol'),
  graderiaFutbolEscalon: leerColor('--graderia-futbol-escalon'),
  graderiaHockey: leerColor('--graderia-hockey'),
  graderiaHockeyEscalon: leerColor('--graderia-hockey-escalon'),
  mini: leerColor('--color-poder-mini'),
  multi: leerColor('--color-poder-multi'),
  gigante: leerColor('--color-poder-gigante'),
  escudo: leerColor('--color-poder-escudo'),
  hielo: leerColor('--color-poder-hielo'),
  zigzag: leerColor('--color-poder-zigzag'),
  turbo: leerColor('--color-poder-turbo')
};

// ----- Niveles: aquí se cambia qué tan difícil es cada uno -----
const NIVELES = {
  facil: {
    nombre: 'fácil',
    velocidadInicial: 6,      // velocidad de la pelota al sacar
    velocidadMaxima: 13,      // tope de velocidad
    aumentoPorPunto: 0.4,     // cuánto más rápido va la pelota después de cada punto que cuenta
    aceleracion: 1.05,        // cuánto acelera en cada golpe (5 %)
    distraccion: 0.15,        // probabilidad de que Petunia se distraiga
    punteria: 12,             // qué tan inclinadas devuelve Petunia (más = más difícil de atajar)
    peligroMin: 7000,         // ms mínimos entre una tanda de peligros y otra
    peligroMax: 11000,        // ms máximos
    fuerzaViento: 0.07
  },
  dificil: {
    nombre: 'difícil',
    velocidadInicial: 8.5,
    velocidadMaxima: 19,
    aumentoPorPunto: 0.7,
    aceleracion: 1.08,
    distraccion: 0.07,
    punteria: 34,             // en difícil Petunia devuelve con ángulos más cerrados
    peligroMin: 4000,
    peligroMax: 7000,
    fuerzaViento: 0.13
  }
};

// Paletas
const PALETA_ANCHO = 14;
const PALETA_MARGEN = 24;
const ALTO_PALETA = 90;        // las dos canastas miden lo mismo en todos los modos
// Teclado: la canasta arranca suave (para ser preciso) y acelera si mantienes la tecla
const VELOCIDAD_JUGADOR = 11;  // rapidez máxima con teclado
const ACELERACION_TECLADO = 0.2; // qué tan rápido llega a la máxima (0 a 1)
const FRENADO_TECLADO = 0.45;    // qué tan rápido frena al soltar la tecla
const SUAVIDAD_PUNTERO = 0.22; // con mouse o dedo: 1 = pegada al dedo, más bajo = más suave
const PELIGROS_A_LA_VEZ = 2;   // cuántos peligros salen en cada tanda

// Pelota
const RADIO_NORMAL = 9;
const PASO_MAXIMO = 6;                      // avanza en pasitos para no atravesar nada
const ANGULO_MAXIMO = 60 * (Math.PI / 180); // nunca sale más inclinada que 60°

// Distracción de Petunia
const ZONA_DISTRACCION = ANCHO * 0.6;
const VELOCIDAD_DISTRAIDA = 5;

// Poderes
const PODER_RADIO = 16;
const PODER_ESPERA_MIN = 6000;
const PODER_ESPERA_MAX = 10000;
const PODER_VISIBLE = 7000;
const PODER_DURACION = 5000;
const RADIO_MINI = 5;
const TURBO = 1.5;
const MULTIBOLA_DURACION = 6000; // ms que duran las 2 pelotas extra
const PODERES = ['mini', 'turbo', 'multi', 'gigante', 'escudo', 'hielo', 'zigzag'];
const ALTO_GIGANTE = 140;        // tamaño de la canasta con el poder gigante
const DURACION_GIGANTE = 6000;
const DURACION_ESCUDO = 10000;   // si nadie lo usa, el escudo se va solo
const DURACION_HIELO = 2500;     // cuánto tiempo queda congelado el rival
const DURACION_ZIGZAG = 5000;

// Peligros
const AFICIONADO_RADIO = 22;
const AFICIONADO_VELOCIDAD = 3.5;
const CELADOR_RADIO = 24;
const CELADOR_VELOCIDAD = 4.5;
const CELADOR_RETRASO = 1200;   // ms que tarda el celador en aparecer
const DRON_RADIO = 24;
const DRON_VELOCIDAD = 2.2;
const VIENTO_DURACION = 4000;
const BOTELLA_RADIO = 16;
const BOTELLA_VUELO = 900;      // ms que tarda la botella en el aire
const ASEADOR_RADIO = 24;
const ASEADOR_VELOCIDAD = 3;
const ASEADOR_RETRASO = 1500;   // ms que tarda en llegar el señor del aseo
const ASEADOR_BARRER = 1400;    // ms que se demora barriendo

// Público
const CRUZANTE_RADIO = 22;       // jugador y señor del trapero

const DURACION_CELEBRACION = 2200;
const TONOS_PIEL = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];

/* =====================================================================
   3. Estado del juego
   ===================================================================== */
let nivel = NIVELES.facil;
let cancha = 'baloncesto';      // 'baloncesto', 'futbol' o 'hockey'
const CLAVE_CANCHA = 'pingpong-cancha';

// El piso y las líneas se dibujan UNA vez en este lienzo aparte y luego solo se pegan.
// Así cada cuadro es mucho más liviano (importante en celular).
const fondo = document.createElement('canvas');
fondo.width = ANCHO;
fondo.height = ALTO;

// Copia del fondo ya girada para el celular vertical: así no hay que girarla en cada cuadro
const fondoVertical = document.createElement('canvas');
fondoVertical.width = ALTO;
fondoVertical.height = ANCHO;

// Cuánto se movió la sacudida en este cuadro (para pegar el fondo vertical en el mismo lugar)
let sacudidaX = 0;
let sacudidaY = 0;
let modo = 'uno';               // 'uno' = contra Petunia, 'dos' = 2 jugadores
let nombreJugador = 'Jugador';
let nombreJugador2 = 'Jugador 2';

const jugador = { x: PALETA_MARGEN, y: 0, alto: ALTO_PALETA, brillo: 0 };
const maquina = {
  x: ANCHO - PALETA_MARGEN - PALETA_ANCHO,
  y: (ALTO - ALTO_PALETA) / 2,
  alto: ALTO_PALETA,
  brillo: 0,
  desfase: 0,
  distraida: false,
  yaDecidio: false,
  huida: 1
};
jugador.y = (ALTO - jugador.alto) / 2;

const pelota = { x: ANCHO / 2, y: ALTO / 2, vx: 0, vy: 0, radio: RADIO_NORMAL, giro: 0 };
const teclas1 = { arriba: false, abajo: false }; // paleta izquierda
const teclas2 = { arriba: false, abajo: false }; // paleta derecha (solo en 2 jugadores)
const punteros = new Map(); // qué dedo o mouse mueve qué paleta

let bonoVelocidad = 0;   // velocidad extra que se va sumando con los puntos
let yaLeGanaste = false; // contra Petunia: ya llegaste a 5 (festejo especial una sola vez)
let tiempoSinGolpe = 0;
let ayuda2J = 0;
let pausado = false;     // el menú de pausa está abierto
let racha = 0;           // golpes seguidos en la jugada actual (el "rally")
let ultimoGolpe = 'jugador'; // quién tocó la pelota de último (se lleva los poderes)
let puntosIzquierda = 0; // tus puntos (o los del jugador 1)
let puntosDerecha = 0;   // puntos de Petunia (o del jugador 2)
let jugando = false;
let enSaque = false;
let temporizadorSaque = null;
let ultimoTiempo = 0;

// Poderes
let poder = null;
let efectoActivo = null;
let pelotasExtra = [];   // las 2 pelotas del poder multibola
let esperaPoder = 0;

// Peligros
let aficionado = null;
let celador = null;
let dron = null;
let viento = null;
let botella = null;
let aseador = null;
let jugadorCruza = null;   // un jugador que cruza la cancha calentando (y a veces se cae)
let trapeador = null;      // el señor del aseo cruzando con el trapero
let esperaPeligro = 0;

// Efectos visuales
let particulas = [];
let mensaje = null;
let sacudida = 0;
let temporizadorFestejo = null;

// Público
let publico = [];
let publicoIzquierda = [];
let publicoDerecha = [];
let celebracion = null;
let reloj = 0;

// Sonido
let audio = null;
let salida = null;     // volumen general
let ruido = null;      // sonido de ruido para aplausos, viento y salpicadas
let sonidoActivo = true;

/* =====================================================================
   4. Funciones de ayuda
   ===================================================================== */
function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function alAzar(minimo, maximo) {
  return minimo + Math.random() * (maximo - minimo);
}

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function anunciar(texto) {
  anuncio.textContent = texto;
}

function actualizarMarcador() {
  marcadorJugador.textContent = puntosIzquierda;
  marcadorMaquina.textContent = puntosDerecha;

  vidas.forEach((vida, indice) => {
    vida.classList.toggle('vida--perdida', indice < puntosDerecha);
  });

  if (modo === 'dos') {
    intentosTexto.textContent = `Gana el primero en llegar a ${META} puntos`;
    return;
  }
  const restantes = INTENTOS - puntosDerecha;
  intentosTexto.textContent = restantes === 1 ? '1 intento restante' : `${restantes} intentos restantes`;
}

// Ajusta el marcador según el modo de juego
function prepararMarcador() {
  const dos = modo === 'dos';
  etiquetaJugador.textContent = nombreJugador;
  etiquetaMaquina.textContent = dos ? nombreJugador2 : TEXTO_MAQUINA;
  etiquetaCentro.textContent = dos ? `Gana el primero en anotar ${META} puntos` : 'Intentos';
  listaVidas.hidden = dos;
}

// Hace "saltar" el número del marcador (la animación está en el CSS)
function animarNumero(elemento) {
  elemento.classList.remove('marcador__numero--pop');
  void elemento.offsetWidth;
  elemento.classList.add('marcador__numero--pop');
}

// Mueve algo (aficionado, celador) hacia un punto. Devuelve true cuando llega
function caminarHacia(objeto, x, y, velocidad, factor) {
  const dx = x - objeto.x;
  const dy = y - objeto.y;
  const distancia = Math.hypot(dx, dy);
  const paso = velocidad * factor;
  if (distancia <= paso) {
    objeto.x = x;
    objeto.y = y;
    return true;
  }
  objeto.x += (dx / distancia) * paso;
  objeto.y += (dy / distancia) * paso;
  return false;
}

/* =====================================================================
   5. Sonidos (se generan con código, no necesitan archivos)
   ===================================================================== */
function prepararAudio() {
  if (!audio) {
    const ContextoAudio = window.AudioContext || window.webkitAudioContext;
    if (!ContextoAudio) return;
    audio = new ContextoAudio();

    // Volumen general + compresor: suena más fuerte sin distorsionar
    const compresor = audio.createDynamicsCompressor();
    salida = audio.createGain();
    salida.gain.value = 1.6;
    salida.connect(compresor).connect(audio.destination);

    // Ruido blanco (para aplausos, viento y salpicadas)
    ruido = audio.createBuffer(1, audio.sampleRate * 0.5, audio.sampleRate);
    const datos = ruido.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }
  // En celular el audio puede quedar "suspendido" o "interrumpido" (iPhone): se reanuda
  if (audio.state !== 'running') audio.resume().catch(() => {});

  // Desbloqueo para celulares: tocar un sonido vacío durante el toque del usuario
  if (!audioDesbloqueado) {
    const vacio = audio.createBuffer(1, 1, audio.sampleRate);
    const fuente = audio.createBufferSource();
    fuente.buffer = vacio;
    fuente.connect(audio.destination);
    fuente.start(0);
    audioDesbloqueado = true;
  }
}

let audioDesbloqueado = false;

// iPhone (Safari 16.4+): que suene aunque el interruptor de silencio esté activado
if (navigator.audioSession) {
  try { navigator.audioSession.type = 'playback'; } catch (error) { /* no pasa nada */ }
}

// Cualquier toque o tecla vuelve a "despertar" el audio (por si el celular lo suspendió)
['pointerdown', 'touchend', 'keydown'].forEach((tipo) => {
  document.addEventListener(tipo, () => {
    if (audio && audio.state !== 'running') audio.resume().catch(() => {});
    else if (!audio && jugando) prepararAudio();
  }, { passive: true });
});

// Al volver a la app o pestaña, se reanuda el audio
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && audio && audio.state !== 'running') audio.resume().catch(() => {});
});

// Toca un tono que va de una frecuencia a otra
function tono({ frecuencia, fin = frecuencia, duracion, tipo = 'square', volumen = 0.1, inicio = 0, filtro = 0 }) {
  if (!audio || !sonidoActivo) return;
  const t = audio.currentTime + inicio;
  const oscilador = audio.createOscillator();
  const volumenNodo = audio.createGain();

  oscilador.type = tipo;
  oscilador.frequency.setValueAtTime(frecuencia, t);
  oscilador.frequency.exponentialRampToValueAtTime(fin, t + duracion);

  volumenNodo.gain.setValueAtTime(0.0001, t);
  volumenNodo.gain.exponentialRampToValueAtTime(volumen, t + 0.015);
  volumenNodo.gain.exponentialRampToValueAtTime(0.0001, t + duracion);

  if (filtro) {
    const pasaBajos = audio.createBiquadFilter();
    pasaBajos.type = 'lowpass';
    pasaBajos.frequency.value = filtro;
    oscilador.connect(pasaBajos).connect(volumenNodo);
  } else {
    oscilador.connect(volumenNodo);
  }
  volumenNodo.connect(salida);
  oscilador.start(t);
  oscilador.stop(t + duracion + 0.05);
}

// Un golpe de ruido filtrado (un aplauso, una salpicada, viento)
function golpeDeRuido({ inicio = 0, frecuencia = 1500, duracion = 0.08, volumen = 0.3, suave = false }) {
  if (!audio || !sonidoActivo) return;
  const t = audio.currentTime + inicio;
  const fuente = audio.createBufferSource();
  const filtro = audio.createBiquadFilter();
  const volumenNodo = audio.createGain();

  fuente.buffer = ruido;
  fuente.loop = true;
  filtro.type = 'bandpass';
  filtro.frequency.value = frecuencia;
  filtro.Q.value = suave ? 0.7 : 1.2;

  const subida = suave ? duracion * 0.3 : 0.004;
  volumenNodo.gain.setValueAtTime(0.0001, t);
  volumenNodo.gain.exponentialRampToValueAtTime(volumen, t + subida);
  volumenNodo.gain.exponentialRampToValueAtTime(0.0001, t + duracion);

  fuente.connect(filtro).connect(volumenNodo).connect(salida);
  fuente.start(t);
  fuente.stop(t + duracion + 0.05);
}

function sonidoGolpe(agudo) {
  tono({ frecuencia: agudo ? 620 : 460, fin: agudo ? 420 : 300, duracion: 0.06, volumen: 0.12 });
}

// Risita corta de burla: "ja ja ja"
function sonidoBurla() {
  [620, 560, 500].forEach((frecuencia, i) => {
    tono({ frecuencia, fin: frecuencia * 0.72, duracion: 0.13, tipo: 'sawtooth', volumen: 0.4, inicio: i * 0.15, filtro: 1700 });
  });
}

function sonidoFallo() {
  tono({ frecuencia: 330, fin: 140, duracion: 0.35, tipo: 'triangle', volumen: 0.3 });
}

// Risa de caricatura: "ja ja ja ja ja jaaaa" cada vez más grave
function sonidoRisa() {
  const notas = [580, 540, 500, 460, 420, 380, 350];
  notas.forEach((frecuencia, i) => {
    tono({ frecuencia, fin: frecuencia * 0.72, duracion: 0.14, tipo: 'sawtooth', volumen: 0.45, inicio: i * 0.16, filtro: 1700 });
  });
  tono({ frecuencia: 340, fin: 140, duracion: 0.8, tipo: 'sawtooth', volumen: 0.45, inicio: notas.length * 0.16, filtro: 1300 });
}

// Felicidad: arpegio hacia arriba y corneta de fiesta
function sonidoFeliz() {
  [523, 659, 784, 1047].forEach((frecuencia, i) => {
    tono({ frecuencia, duracion: 0.15, tipo: 'square', volumen: 0.22, inicio: i * 0.09 });
  });
  tono({ frecuencia: 1047, fin: 1568, duracion: 0.32, tipo: 'square', volumen: 0.2, inicio: 0.36 });
  for (let i = 0; i < 8; i++) {
    tono({ frecuencia: 700, fin: 760, duracion: 0.05, tipo: 'sawtooth', volumen: 0.18, inicio: 0.72 + i * 0.05, filtro: 2500 });
  }
}

// Aplausos: muchos golpecitos de ruido a destiempo
function sonidoAplausos(duracion = 1.8) {
  for (let i = 0; i < 50; i++) {
    golpeDeRuido({ inicio: Math.random() * duracion, frecuencia: alAzar(900, 2600), duracion: 0.07, volumen: alAzar(0.2, 0.5) });
  }
}

// Multibola: "pop, pop, pop" hacia arriba
function sonidoMultibola() {
  [520, 700, 940].forEach((frecuencia, i) => {
    tono({ frecuencia, fin: frecuencia * 1.3, duracion: 0.09, tipo: 'square', volumen: 0.22, inicio: i * 0.08 });
  });
}

function sonidoCrecer() {
  tono({ frecuencia: 200, fin: 700, duracion: 0.35, tipo: 'square', volumen: 0.18 });
}

function sonidoEscudo() {
  tono({ frecuencia: 880, fin: 1320, duracion: 0.12, tipo: 'triangle', volumen: 0.3 });
  tono({ frecuencia: 1320, fin: 1760, duracion: 0.18, tipo: 'triangle', volumen: 0.25, inicio: 0.1 });
}

function sonidoHielo() {
  [1800, 2200, 2600, 3000].forEach((frecuencia, i) => {
    tono({ frecuencia, duracion: 0.08, tipo: 'sine', volumen: 0.18, inicio: i * 0.05 });
  });
}

function sonidoZigzag() {
  [400, 700, 400, 700].forEach((frecuencia, i) => {
    tono({ frecuencia, duracion: 0.07, tipo: 'square', volumen: 0.15, inicio: i * 0.07 });
  });
}

function sonidoBoing() {
  tono({ frecuencia: 150, fin: 600, duracion: 0.12, tipo: 'sine', volumen: 0.45 });
  tono({ frecuencia: 600, fin: 220, duracion: 0.25, tipo: 'sine', volumen: 0.4, inicio: 0.12 });
}

function sonidoSilbato() {
  for (let i = 0; i < 6; i++) {
    tono({ frecuencia: i % 2 ? 2900 : 2600, duracion: 0.06, tipo: 'sine', volumen: 0.25, inicio: i * 0.06 });
  }
  tono({ frecuencia: 2800, duracion: 0.4, tipo: 'sine', volumen: 0.25, inicio: 0.4 });
}

function sonidoViento() {
  golpeDeRuido({ frecuencia: 450, duracion: 1.6, volumen: 0.35, suave: true });
}

// Botella volando por el aire
function sonidoLanzar() {
  golpeDeRuido({ frecuencia: 1800, duracion: 0.6, volumen: 0.25, suave: true });
}

// Botella plástica cayendo: "toc, toc, toc"
function sonidoBotella() {
  tono({ frecuencia: 900, fin: 600, duracion: 0.05, tipo: 'triangle', volumen: 0.4 });
  tono({ frecuencia: 800, fin: 550, duracion: 0.05, tipo: 'triangle', volumen: 0.3, inicio: 0.12 });
  tono({ frecuencia: 750, fin: 500, duracion: 0.04, tipo: 'triangle', volumen: 0.2, inicio: 0.2 });
}

// Escoba barriendo: "shh, shh, shh"
function sonidoBarrer() {
  for (let i = 0; i < 4; i++) {
    golpeDeRuido({ inicio: i * 0.32, frecuencia: 3500, duracion: 0.25, volumen: 0.25, suave: true });
  }
}

function cambiarSonido() {
  prepararAudio();
  sonidoActivo = !sonidoActivo;
  botonSonido.setAttribute('aria-pressed', String(sonidoActivo));
  botonSonido.textContent = sonidoActivo ? '🔊 Sonido: sí' : '🔇 Sonido: no';
}

/* =====================================================================
   6. Público en las graderías
   ===================================================================== */
// Se crea una sola vez: 3 escalones por lado, con una persona cada 28 px
function crearPublico() {
  publico = [];
  const columnas = [18, 50, 82];

  ['jugador', 'maquina'].forEach((lado) => {
    const colorEquipo = lado === 'jugador' ? COLORES.jugador : COLORES.maquina;
    const inicioX = lado === 'jugador' ? -GRADERIA : ANCHO;

    columnas.forEach((columna) => {
      for (let y = 26; y < ALTO - 10; y += 28) {
        publico.push({
          lado,
          x: inicioX + columna + alAzar(-2, 2),
          y: y + alAzar(-2, 2),
          camiseta: Math.random() < 0.7 ? colorEquipo : elegir(['#ffffff', COLORES.borde, COLORES.pelota]),
          piel: elegir(TONOS_PIEL),
          fase: Math.random() * Math.PI * 2,
          fuera: false,
          lanza: 0 // ms que le queda con el brazo arriba (si tiró una botella)
        });
      }
    });
  });
}

function separarPublico() {
  publicoIzquierda = publico.filter((persona) => persona.lado === 'jugador');
  publicoDerecha = publico.filter((persona) => persona.lado === 'maquina');
}

function celebrar(lado, conSonido = true) {
  celebracion = { lado, restante: DURACION_CELEBRACION };
  if (conSonido) sonidoAplausos();

  // Confeti saliendo de la gradería que celebra
  const inicioX = lado === 'jugador' ? -GRADERIA : ANCHO;
  const colores = [COLORES.jugador, COLORES.maquina, COLORES.borde, COLORES.mini, '#ffffff'];
  const confeti = Math.min(45, MAX_PARTICULAS - particulas.length);
  for (let i = 0; i < confeti; i++) {
    particulas.push({
      x: inicioX + alAzar(5, GRADERIA - 5),
      y: alAzar(ALTO * 0.2, ALTO * 0.9),
      vx: alAzar(-1.5, 1.5),
      vy: alAzar(-7, -3),
      vida: 1,
      desgaste: 0.012,
      gravedad: 0.18,
      tamano: alAzar(3, 5),
      color: elegir(colores)
    });
  }
}

// Pega el fondo guardado. En vertical se pega la copia ya girada, sin transformaciones:
// es lo más liviano posible para el celular
function pegarFondo() {
  ctx.imageSmoothingEnabled = false;
  if (vertical) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // la sacudida girada 90° también: (x, y) pasa a (y, -x)
    ctx.drawImage(fondoVertical, sacudidaY, GRADERIA - sacudidaX);
    ctx.restore();
  } else {
    ctx.drawImage(fondo, 0, 0);
  }
  ctx.imageSmoothingEnabled = true;
}

// "La ola": cada 15 segundos pasa una ola por las dos graderías (dura 3 segundos)
function enLaOla(persona) {
  if (reducirMovimiento) return false;
  const t = reloj % 15000;
  if (t > 3000) return false;
  const olaY = -60 + (t / 3000) * (ALTO + 120);
  return Math.abs(persona.y - olaY) < 35;
}

function dibujarPersona(persona, celebra) {
  let salto = 0;
  let separacion = 0;
  const ola = !celebra && enLaOla(persona);

  if (celebra) {
    salto = reducirMovimiento ? 0 : -Math.abs(Math.sin(reloj * 0.012 + persona.fase)) * 7;
    // Las manos se juntan y se separan: están aplaudiendo
    separacion = reducirMovimiento ? 4 : 2.5 + (Math.sin(reloj * 0.05 + persona.fase * 2) + 1) * 3;
  } else if (ola) {
    salto = -6;      // se paran con los brazos arriba
    separacion = 8;
  } else if (!reducirMovimiento) {
    // Siempre se mecen un poquito: la afición está viva
    salto = -Math.abs(Math.sin(reloj * 0.004 + persona.fase)) * 1.6;
  }

  const x = persona.x;
  const y = persona.y + salto;

  if (celebra || ola) {
    // Brazos arriba
    ctx.strokeStyle = persona.camiseta;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 5);
    ctx.lineTo(x - separacion, y - 10);
    ctx.moveTo(x + 6, y + 5);
    ctx.lineTo(x + separacion, y - 10);
    ctx.stroke();

    // Manos
    ctx.fillStyle = persona.piel;
    ctx.beginPath();
    ctx.arc(x - separacion, y - 11, 2.2, 0, Math.PI * 2);
    ctx.arc(x + separacion, y - 11, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Chispitas cuando chocan las manos (¡clap!)
    if (celebra && separacion < 3.5 && !reducirMovimiento) {
      ctx.strokeStyle = COLORES.borde;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 16);
      ctx.lineTo(x - 6, y - 19);
      ctx.moveTo(x, y - 17);
      ctx.lineTo(x, y - 21);
      ctx.moveTo(x + 4, y - 16);
      ctx.lineTo(x + 6, y - 19);
      ctx.stroke();
    }
  }

  // El que tiró la botella deja el brazo arriba un momento
  if (!celebra && persona.lanza > 0) {
    ctx.strokeStyle = persona.camiseta;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 5);
    ctx.lineTo(x + 9, y - 10);
    ctx.stroke();
  }

  // Cuerpo (hombros redondeados)
  ctx.fillStyle = persona.camiseta;
  ctx.beginPath();
  ctx.arc(x, y + 8, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 8, y + 8, 16, 5);

  // Cabeza
  ctx.fillStyle = persona.piel;
  ctx.beginPath();
  ctx.arc(x, y - 1, 5, 0, Math.PI * 2);
  ctx.fill();
}

function coloresGraderia() {
  if (cancha === 'futbol') return { base: COLORES.graderiaFutbol, escalon: COLORES.graderiaFutbolEscalon };
  if (cancha === 'hockey') return { base: COLORES.graderiaHockey, escalon: COLORES.graderiaHockeyEscalon };
  return { base: COLORES.graderia, escalon: COLORES.graderiaEscalon };
}

function dibujarGraderia(lado) {
  const inicioX = lado === 'jugador' ? -GRADERIA : ANCHO;

  const colores = coloresGraderia();
  ctx.fillStyle = colores.base;
  ctx.fillRect(inicioX, 0, GRADERIA, ALTO);
  ctx.fillStyle = colores.escalon;
  [2, 66].forEach((escalon) => {
    ctx.fillRect(inicioX + escalon, 0, 32, ALTO);
  });

  // Baranda entre la gradería y la cancha
  ctx.fillStyle = COLORES.borde;
  ctx.fillRect(lado === 'jugador' ? -5 : ANCHO, 0, 5, ALTO);

  const celebra = celebracion && celebracion.lado === lado;
  const grupo = lado === 'jugador' ? publicoIzquierda : publicoDerecha;

  // Mientras celebran, cada uno se dibuja aparte (aplauden y saltan)
  if (celebra) {
    for (const persona of grupo) {
      if (!persona.fuera) dibujarPersona(persona, true);
    }
    return;
  }

  // Si no celebran: los que están en "la ola" se dibujan aparte, y todos los
  // demás se pintan por grupos de color (una sola pintada por color es mucho
  // más rápido que una por persona, sobre todo en celular)
  const camisetas = new Map();
  const caras = new Map();
  for (const persona of grupo) {
    if (persona.fuera) continue;
    if (enLaOla(persona)) {
      dibujarPersona(persona, false);
      continue;
    }
    const y = persona.y + (reducirMovimiento ? 0 : -Math.abs(Math.sin(reloj * 0.004 + persona.fase)) * 1.6);
    if (!camisetas.has(persona.camiseta)) camisetas.set(persona.camiseta, []);
    if (!caras.has(persona.piel)) caras.set(persona.piel, []);
    camisetas.get(persona.camiseta).push(persona.x, y);
    caras.get(persona.piel).push(persona.x, y);
  }

  camisetas.forEach((puntos, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < puntos.length; i += 2) {
      const x = puntos[i];
      const y = puntos[i + 1];
      ctx.moveTo(x - 8, y + 8);
      ctx.arc(x, y + 8, 8, Math.PI, 0);
      ctx.lineTo(x + 8, y + 13);
      ctx.lineTo(x - 8, y + 13);
      ctx.closePath();
    }
    ctx.fill();
  });

  caras.forEach((puntos, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < puntos.length; i += 2) {
      ctx.moveTo(puntos[i] + 5, puntos[i + 1] - 1);
      ctx.arc(puntos[i], puntos[i + 1] - 1, 5, 0, Math.PI * 2);
    }
    ctx.fill();
  });
}

/* =====================================================================
   7. Efectos visuales: chispas, confeti, serpentinas, mensajes y festejo
   ===================================================================== */
function crearParticulas(x, y, color, cantidad, fuerza) {
  cantidad = Math.min(cantidad, MAX_PARTICULAS - particulas.length);
  for (let i = 0; i < cantidad; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidad = Math.random() * fuerza + 1;
    particulas.push({
      x,
      y,
      vx: Math.cos(angulo) * velocidad,
      vy: Math.sin(angulo) * velocidad,
      vida: 1,
      desgaste: 0.03,
      gravedad: 0,
      tamano: Math.random() * 3 + 2,
      color
    });
  }
}

function lanzarSerpentinas() {
  const colores = [COLORES.jugador, COLORES.maquina, COLORES.borde, COLORES.mini, COLORES.turbo];
  const cuantas = Math.min(35, MAX_PARTICULAS - particulas.length);
  for (let i = 0; i < cuantas; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidad = alAzar(4, 10);
    particulas.push({
      serpentina: true,
      x: ANCHO / 2,
      y: ALTO / 2,
      vx: Math.cos(angulo) * velocidad,
      vy: Math.sin(angulo) * velocidad - 3,
      vida: 1,
      desgaste: 0.009,
      gravedad: 0.12,
      tamano: alAzar(14, 22),
      giro: Math.random() * Math.PI,
      color: elegir(colores)
    });
  }
}

function mostrarMensaje(texto, color) {
  mensaje = { texto, color, vida: 1 };
}

function efectoPunto(x, y, color, texto) {
  crearParticulas(x, y, color, 40, 6);
  mostrarMensaje(texto, color);
  if (!reducirMovimiento) sacudida = 12;
}

// Muestra un gato por 1.8 segundos arriba del lado de quien anotó
// lado: 'izquierda' o 'derecha'
function mostrarGato(imagen, lado) {
  esconderFestejo();
  imagen.classList.toggle('festejo--izquierda', lado === 'izquierda');
  imagen.classList.toggle('festejo--derecha', lado === 'derecha');
  void imagen.offsetWidth; // reinicia la animación si sale dos veces seguidas
  imagen.hidden = false;
  temporizadorFestejo = setTimeout(() => {
    imagen.hidden = true;
  }, 1800);
}

function mostrarFestejo(lado) {
  mostrarGato(festejo, lado);
}

// Petunia se burla desde su lado (la derecha)
function mostrarBurla() {
  mostrarGato(burla, 'derecha');
}

function esconderFestejo() {
  clearTimeout(temporizadorFestejo);
  festejo.hidden = true;
  burla.hidden = true;
}

function actualizarEfectos(factor) {
  const ms = factor * MS_POR_CUADRO;
  reloj += ms;

  particulas.forEach((p) => {
    p.vy += p.gravedad * factor;
    p.x += p.vx * factor;
    p.y += p.vy * factor;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.vida -= p.desgaste * factor;
    if (p.serpentina) p.giro += 0.1 * factor;
  });
  particulas = particulas.filter((p) => p.vida > 0);

  if (mensaje) {
    mensaje.vida -= 0.015 * factor;
    if (mensaje.vida <= 0) mensaje = null;
  }

  if (celebracion) {
    celebracion.restante -= ms;
    if (celebracion.restante <= 0) celebracion = null;
  }

  sacudida = Math.max(0, sacudida - 0.8 * factor);
  ayuda2J = Math.max(0, ayuda2J - ms);
  jugador.brillo = Math.max(0, jugador.brillo - 0.08 * factor);
  maquina.brillo = Math.max(0, maquina.brillo - 0.08 * factor);
}

/* =====================================================================
   8. Poderes (bola mini y turbo)
   ===================================================================== */
function colorPoder(tipo) {
  return COLORES[tipo] || COLORES.turbo;
}

// Nombre de quien tiene cada lado
function nombreDe(lado) {
  if (lado === 'jugador') return nombreJugador;
  return modo === 'dos' ? nombreJugador2 : NOMBRE_MAQUINA;
}

function paletaDe(lado) {
  return lado === 'jugador' ? jugador : maquina;
}

function actualizarPoderes(ms) {
  if (efectoActivo) {
    efectoActivo.restante -= ms;
    if (efectoActivo.restante <= 0) terminarEfecto();
  }

  if (poder) {
    poder.vida -= ms;
    poder.pulso += ms;
    if (poder.vida <= 0) {
      poder = null;
      esperaPoder = alAzar(PODER_ESPERA_MIN, PODER_ESPERA_MAX);
    }
    return;
  }

  if (efectoActivo) return;

  esperaPoder -= ms;
  if (esperaPoder <= 0) {
    poder = {
      x: alAzar(ANCHO * 0.3, ANCHO * 0.7),
      y: alAzar(60, ALTO - 60),
      tipo: elegir(PODERES),
      vida: PODER_VISIBLE,
      pulso: 0
    };
  }
}

function revisarPoder() {
  if (!poder) return;
  if (Math.hypot(pelota.x - poder.x, pelota.y - poder.y) >= pelota.radio + PODER_RADIO) return;

  const tipo = poder.tipo;
  const color = colorPoder(tipo);
  crearParticulas(poder.x, poder.y, color, 30, 5);
  // Los poderes de canasta (gigante, escudo, hielo) son para quien tocó la pelota de último
  const dueno = ultimoGolpe;
  const rival = dueno === 'jugador' ? 'maquina' : 'jugador';
  const textos = {
    mini: '¡Bola mini!',
    turbo: '¡Turbo!',
    multi: '¡Multibola!',
    gigante: `¡Gigante para ${nombreDe(dueno)}!`,
    escudo: `¡Escudo para ${nombreDe(dueno)}!`,
    hielo: `¡${nombreDe(rival)} quedó en hielo!`,
    zigzag: '¡Zigzag!'
  };
  const avisos = {
    mini: 'Poder: la pelota se hizo pequeña.',
    turbo: 'Poder: la pelota va más rápido.',
    multi: 'Poder: aparecieron 2 pelotas extra por unos segundos.',
    gigante: `Poder: la canasta de ${nombreDe(dueno)} se agrandó.`,
    escudo: `Poder: ${nombreDe(dueno)} tiene un escudo que lo salva de un punto.`,
    hielo: `Poder: ${nombreDe(rival)} quedó en hielo unos segundos.`,
    zigzag: 'Poder: la pelota se mueve en zigzag.'
  };
  mostrarMensaje(textos[tipo], color);
  anunciar(avisos[tipo]);

  poder = null;
  const duraciones = {
    multi: MULTIBOLA_DURACION,
    gigante: DURACION_GIGANTE,
    escudo: DURACION_ESCUDO,
    hielo: DURACION_HIELO,
    zigzag: DURACION_ZIGZAG
  };
  const duracion = duraciones[tipo] || PODER_DURACION;
  efectoActivo = { tipo, restante: duracion, duracion, lado: dueno };

  if (tipo === 'mini') pelota.radio = RADIO_MINI;
  if (tipo === 'multi') soltarPelotasExtra();
  if (tipo === 'gigante') {
    const paleta = paletaDe(dueno);
    paleta.y = limitar(paleta.y - (ALTO_GIGANTE - paleta.alto) / 2, 0, ALTO - ALTO_GIGANTE);
    paleta.alto = ALTO_GIGANTE;
    sonidoCrecer();
  }
  if (tipo === 'escudo') sonidoEscudo();
  if (tipo === 'hielo') {
    const congelada = paletaDe(rival);
    congelada.congelado = true;
    congelada.velTeclado = 0;
    efectoActivo.lado = rival; // aquí "lado" es quien quedó congelado
    crearParticulas(congelada.x + PALETA_ANCHO / 2, congelada.y + congelada.alto / 2, COLORES.hielo, 20, 3);
    sonidoHielo();
  }
  if (tipo === 'zigzag') sonidoZigzag();
}

// Multibola: de la nada salen 2 pelotas más, abriéndose desde la pelota principal
function soltarPelotasExtra() {
  const velocidad = Math.max(nivel.velocidadInicial, Math.hypot(pelota.vx, pelota.vy));
  const base = Math.atan2(pelota.vy, pelota.vx);
  pelotasExtra = [-0.45, 0.45].map((giro) => {
    let angulo = base + giro;
    // que no salga casi vertical
    const horizontal = Math.cos(angulo) >= 0 ? 1 : -1;
    const inclinacion = limitar(Math.atan2(Math.sin(angulo), Math.abs(Math.cos(angulo))), -ANGULO_MAXIMO, ANGULO_MAXIMO);
    angulo = horizontal === 1 ? inclinacion : Math.PI - inclinacion;
    return {
      x: pelota.x,
      y: pelota.y,
      vx: Math.cos(angulo) * velocidad,
      vy: Math.sin(angulo) * velocidad,
      radio: RADIO_NORMAL,
      giro: 0
    };
  });

  // Aviso visual: anillo de chispas y una sacudidita
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    if (particulas.length >= MAX_PARTICULAS) break;
    particulas.push({
      x: pelota.x, y: pelota.y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5,
      vida: 1, desgaste: 0.025, gravedad: 0, tamano: 4, color: COLORES.multi
    });
  }
  if (!reducirMovimiento) sacudida = 6;
  sonidoMultibola();
}

function quitarPelotasExtra() {
  pelotasExtra.forEach((b) => crearParticulas(b.x, b.y, COLORES.multi, 10, 3));
  pelotasExtra = [];
}

function terminarEfecto() {
  if (efectoActivo && efectoActivo.tipo === 'multi') quitarPelotasExtra();
  if (efectoActivo && efectoActivo.tipo === 'gigante') {
    // la canasta vuelve a su tamaño, centrada donde estaba
    const paleta = paletaDe(efectoActivo.lado);
    paleta.y = limitar(paleta.y + (paleta.alto - ALTO_PALETA) / 2, 0, ALTO - ALTO_PALETA);
    paleta.alto = ALTO_PALETA;
  }
  if (efectoActivo && efectoActivo.tipo === 'hielo') {
    paletaDe(efectoActivo.lado).congelado = false;
  }
  efectoActivo = null;
  pelota.radio = RADIO_NORMAL;
  esperaPoder = alAzar(PODER_ESPERA_MIN, PODER_ESPERA_MAX);
}

// Mueve las pelotas extra: rebotan en bordes y canastas, y si se salen cuentan punto
function moverPelotasExtra(factor) {
  for (let i = pelotasExtra.length - 1; i >= 0; i--) {
    const b = pelotasExtra[i];
    const pasos = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * factor / PASO_MAXIMO));
    let salio = false;
    for (let k = 0; k < pasos && !salio; k++) {
      const f = factor / pasos;
      b.x += b.vx * f;
      b.y += b.vy * f;
      if (b.y - b.radio < 0) { b.y = b.radio; b.vy = Math.abs(b.vy); }
      if (b.y + b.radio > ALTO) { b.y = ALTO - b.radio; b.vy = -Math.abs(b.vy); }

      if (b.vx < 0 && b.x > jugador.x && tocaPaletaBola(b, jugador)) {
        b.x = jugador.x + PALETA_ANCHO + b.radio;
        b.vx = Math.abs(b.vx);
        b.vy += (b.y - (jugador.y + jugador.alto / 2)) * 0.08;
        jugador.brillo = 1;
        sonidoGolpe(true);
      }
      if (b.vx > 0 && b.x < maquina.x + PALETA_ANCHO && tocaPaletaBola(b, maquina)) {
        b.x = maquina.x - b.radio;
        b.vx = -Math.abs(b.vx);
        b.vy += (b.y - (maquina.y + maquina.alto / 2)) * 0.08;
        maquina.brillo = 1;
        sonidoGolpe(false);
      }
      b.vy = limitar(b.vy, -Math.abs(b.vx) * 1.7, Math.abs(b.vx) * 1.7); // que no se vuelva vertical
      b.giro += b.vx * 0.02 * f;

      if (b.x - b.radio > ANCHO) {
        pelotasExtra.splice(i, 1);
        salio = true;
        puntoIzquierda(b);
      } else if (b.x + b.radio < 0) {
        pelotasExtra.splice(i, 1);
        salio = true;
        puntoDerecha(b);
      }
    }
    if (!jugando) return; // un punto de una pelota extra pudo terminar la partida
  }
}

function tocaPaletaBola(b, paleta) {
  return (
    b.x + b.radio >= paleta.x &&
    b.x - b.radio <= paleta.x + PALETA_ANCHO &&
    b.y + b.radio >= paleta.y &&
    b.y - b.radio <= paleta.y + paleta.alto
  );
}

function dibujarPelotasExtra() {
  pelotasExtra.forEach((b) => {
    // Aro morado para distinguirlas de la principal
    ctx.strokeStyle = COLORES.multi;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radio + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    dibujarUnaPelota(b.x, b.y, b.radio, b.giro, null);
  });
}

function multiplicadorVelocidad() {
  return efectoActivo && efectoActivo.tipo === 'turbo' ? TURBO : 1;
}

/* =====================================================================
   9. Peligros: aficionado + celador, dron, viento y botella + señor del aseo
   ===================================================================== */
function programarPeligro() {
  esperaPeligro = alAzar(nivel.peligroMin, nivel.peligroMax);
}

// Lanza una tanda de peligros distintos (los que no estén ya en la cancha)
function lanzarPeligro() {
  const opciones = [];
  if (!aficionado && !celador) opciones.push(aparecerAficionado);
  if (!dron) opciones.push(aparecerDron);
  if (!viento) opciones.push(empezarViento);
  if (!botella && !aseador) opciones.push(lanzarBotella);
  if (!jugadorCruza) opciones.push(aparecerJugadorCruza);
  if (!trapeador && !aseador) opciones.push(aparecerTrapeador);

  // Se revuelven y se toman los primeros, así salen al menos 2 diferentes
  opciones.sort(() => Math.random() - 0.5);
  opciones.slice(0, PELIGROS_A_LA_VEZ).forEach((aparecer) => aparecer());
}

function actualizarPeligros(factor) {
  const ms = factor * MS_POR_CUADRO;

  esperaPeligro -= ms;
  if (esperaPeligro <= 0) {
    lanzarPeligro();
    programarPeligro();
  }

  actualizarAficionado(factor, ms);
  actualizarCelador(factor, ms);
  actualizarDron(factor, ms);
  actualizarViento(factor, ms);
  actualizarBotella(factor, ms);
  actualizarAseador(factor, ms);
  actualizarJugadorCruza(factor, ms);
  actualizarTrapeador(factor, ms);
}

function limpiarPeligros() {
  if (aficionado) aficionado.persona.fuera = false;
  aficionado = null;
  celador = null;
  dron = null;
  viento = null;
  if (botella) botella.lanzador.lanza = 0;
  botella = null;
  aseador = null;
  jugadorCruza = null;
  trapeador = null;
}

// La pelota cambia de dirección de golpe
// modo 'devolver': se regresa hacia donde venía. modo 'azar': para cualquier lado
function desviarPelota(modo, texto, color) {
  const velocidad = Math.hypot(pelota.vx, pelota.vy);
  let direccion;
  if (modo === 'devolver') {
    direccion = pelota.vx > 0 ? -1 : 1;
  } else {
    direccion = Math.random() < 0.5 ? -1 : 1;
  }
  const angulo = alAzar(-55, 55) * (Math.PI / 180);
  pelota.vx = direccion * velocidad * Math.cos(angulo);
  pelota.vy = velocidad * Math.sin(angulo);

  maquina.distraida = false;
  if (pelota.vx > 0) {
    maquina.yaDecidio = false;
    maquina.desfase = alAzar(-nivel.punteria, nivel.punteria);
  }

  crearParticulas(pelota.x, pelota.y, color, 16, 4);
  mostrarMensaje(texto, color);
  sonidoBoing();
}

// Cambia el ángulo de la pelota sin cambiar su velocidad ni pasar de 60°
function ajustarAngulo(angulo, velocidad) {
  const direccion = pelota.vx >= 0 ? 1 : -1;
  const final = limitar(angulo, -ANGULO_MAXIMO, ANGULO_MAXIMO);
  pelota.vx = direccion * velocidad * Math.cos(final);
  pelota.vy = velocidad * Math.sin(final);
}

function revisarChoque(obstaculo, radio, modo, texto, color) {
  if (!obstaculo || obstaculo.pausaChoque > 0) return;
  if (Math.hypot(pelota.x - obstaculo.x, pelota.y - obstaculo.y) > pelota.radio + radio) return;
  obstaculo.pausaChoque = 600; // para que no choque varias veces seguidas
  desviarPelota(modo, texto, color);
}

// ----- Aficionado y celador -----
function aparecerAficionado() {
  const lado = Math.random() < 0.5 ? 'jugador' : 'maquina';
  const persona = elegir(publico.filter((p) => p.lado === lado && !p.fuera));
  persona.fuera = true;

  aficionado = {
    persona,
    x: persona.x,
    y: persona.y,
    destinoX: alAzar(ANCHO * 0.35, ANCHO * 0.65),
    destinoY: alAzar(80, ALTO - 80),
    fase: 'entrando',
    pausaChoque: 0,
    paso: 0
  };

  // El celador entra por arriba o por abajo, un poquito después
  const entrada = Math.random() < 0.5 ? -45 : ALTO + 45;
  celador = {
    x: aficionado.destinoX + alAzar(-80, 80),
    y: entrada,
    entradaY: entrada,
    fase: 'esperando',
    retraso: CELADOR_RETRASO,
    pausaChoque: 0,
    paso: 0
  };

  mostrarMensaje('¡Se metió un aficionado!', COLORES.borde);
  anunciar('¡Un aficionado se metió a la cancha!');
}

function actualizarAficionado(factor, ms) {
  if (!aficionado) return;
  aficionado.paso += factor;
  aficionado.pausaChoque = Math.max(0, aficionado.pausaChoque - ms);

  if (aficionado.fase === 'entrando') {
    if (caminarHacia(aficionado, aficionado.destinoX, aficionado.destinoY, AFICIONADO_VELOCIDAD, factor)) {
      aficionado.fase = 'bailando'; // baila hasta que llegue el celador
    }
  } else if (aficionado.fase === 'escoltado') {
    const persona = aficionado.persona;
    if (caminarHacia(aficionado, persona.x, persona.y, AFICIONADO_VELOCIDAD * 0.8, factor)) {
      // Llegó a su puesto: vuelve a la gradería y el celador se va
      persona.fuera = false;
      aficionado = null;
      if (celador) celador.fase = 'saliendo';
    }
  }
}

function actualizarCelador(factor, ms) {
  if (!celador) return;
  celador.paso += factor;
  celador.pausaChoque = Math.max(0, celador.pausaChoque - ms);

  if (celador.fase === 'esperando') {
    celador.retraso -= ms;
    if (celador.retraso <= 0) {
      celador.fase = 'buscando';
      mostrarMensaje('¡Seguridad!', COLORES.chaleco);
      sonidoSilbato();
      anunciar('Llegó el celador a sacar al aficionado.');
    }
  } else if (celador.fase === 'buscando') {
    if (!aficionado) {
      celador.fase = 'saliendo';
      return;
    }
    caminarHacia(celador, aficionado.x, aficionado.y, CELADOR_VELOCIDAD, factor);
    if (Math.hypot(celador.x - aficionado.x, celador.y - aficionado.y) < 28) {
      aficionado.fase = 'escoltado';
      celador.fase = 'escoltando';
    }
  } else if (celador.fase === 'escoltando') {
    if (!aficionado) {
      celador.fase = 'saliendo';
      return;
    }
    // Camina detrás del aficionado, empujándolo hacia su puesto
    const haciaPuesto = Math.sign(aficionado.persona.x - aficionado.x) || 1;
    caminarHacia(celador, aficionado.x - haciaPuesto * 26, aficionado.y, CELADOR_VELOCIDAD, factor);
  } else if (celador.fase === 'saliendo') {
    if (caminarHacia(celador, celador.x, celador.entradaY, CELADOR_VELOCIDAD, factor)) {
      celador = null;
    }
  }
}

// ----- Dron de la transmisión -----
function aparecerDron() {
  const bajando = Math.random() < 0.5;
  const x = alAzar(ANCHO * 0.3, ANCHO * 0.7);
  dron = {
    x,
    baseX: x,
    y: bajando ? -35 : ALTO + 35,
    vy: bajando ? DRON_VELOCIDAD : -DRON_VELOCIDAD,
    tiempo: 0,
    pausaChoque: 0
  };
  mostrarMensaje('¡Un dron!', COLORES.lineas);
  anunciar('Un dron está cruzando la cancha.');
}

function actualizarDron(factor, ms) {
  if (!dron) return;
  dron.tiempo += ms;
  dron.pausaChoque = Math.max(0, dron.pausaChoque - ms);
  dron.y += dron.vy * factor;
  dron.x = dron.baseX + Math.sin(dron.tiempo / 400) * 60; // va zigzagueando
  if (dron.tiempo > 1000 && (dron.y < -45 || dron.y > ALTO + 45)) dron = null;
}

// ----- Ráfaga de viento -----
function empezarViento() {
  const direccion = Math.random() < 0.5 ? -1 : 1;
  viento = {
    direccion,
    restante: VIENTO_DURACION,
    rayas: Array.from({ length: 22 }, () => ({ x: alAzar(0, ANCHO), y: alAzar(0, ALTO), largo: alAzar(20, 50) }))
  };
  mostrarMensaje(direccion < 0 ? '¡Viento hacia arriba!' : '¡Viento hacia abajo!', COLORES.lineas);
  sonidoViento();
  anunciar(direccion < 0 ? 'Viento: la pelota se desvía hacia arriba.' : 'Viento: la pelota se desvía hacia abajo.');
}

function actualizarViento(factor, ms) {
  if (!viento) return;
  viento.restante -= ms;
  viento.rayas.forEach((raya) => {
    raya.y += viento.direccion * 9 * factor;
    if (raya.y < -60) raya.y = ALTO + 60;
    if (raya.y > ALTO + 60) raya.y = -60;
  });
  if (viento.restante <= 0) viento = null;
}

// ----- Botella lanzada desde la gradería + señor del aseo -----
function lanzarBotella() {
  const lado = Math.random() < 0.5 ? 'jugador' : 'maquina';
  const lanzador = elegir(publico.filter((p) => p.lado === lado && !p.fuera));
  lanzador.lanza = 700; // levanta el brazo

  const destinoX = alAzar(ANCHO * 0.3, ANCHO * 0.7);
  botella = {
    lanzador,
    inicioX: lanzador.x,
    inicioY: lanzador.y,
    x: lanzador.x,
    y: lanzador.y,
    destinoX,
    destinoY: alAzar(70, ALTO - 70),
    altura: 0,
    fase: 'volando',
    tiempo: 0,
    giro: 0,
    velocidadGiro: (Math.random() < 0.5 ? -1 : 1) * alAzar(0.25, 0.4),
    vx: 0,
    vy: 0,
    pausaChoque: 0
  };

  // El señor del aseo entra por arriba o por abajo
  const entrada = Math.random() < 0.5 ? -45 : ALTO + 45;
  aseador = {
    x: destinoX + alAzar(-70, 70),
    y: entrada,
    entradaY: entrada,
    fase: 'esperando',
    retraso: BOTELLA_VUELO + ASEADOR_RETRASO,
    barrer: ASEADOR_BARRER,
    pausaChoque: 0,
    paso: 0
  };

  mostrarMensaje('¡Tiraron una botella!', COLORES.lineas);
  sonidoLanzar();
  anunciar('Alguien tiró una botella a la cancha.');
}

function actualizarBotella(factor, ms) {
  if (!botella) return;
  botella.lanzador.lanza = Math.max(0, botella.lanzador.lanza - ms);
  botella.pausaChoque = Math.max(0, botella.pausaChoque - ms);

  if (botella.fase === 'volando') {
    // Vuela en curva: avanza hacia el destino y sube y baja (la "altura")
    botella.tiempo += ms;
    const avance = Math.min(1, botella.tiempo / BOTELLA_VUELO);
    botella.x = botella.inicioX + (botella.destinoX - botella.inicioX) * avance;
    botella.y = botella.inicioY + (botella.destinoY - botella.inicioY) * avance;
    botella.altura = Math.sin(avance * Math.PI) * 80;
    botella.giro += botella.velocidadGiro * 1.5 * factor;

    if (avance >= 1) {
      botella.fase = 'piso';
      botella.altura = 0;
      crearParticulas(botella.x, botella.y, COLORES.lineas, 8, 2);
      sonidoBotella();
    }
    return;
  }

  // En el piso: rueda un poquito y se va frenando
  botella.x += botella.vx * factor;
  botella.y += botella.vy * factor;
  botella.vx *= 0.92;
  botella.vy *= 0.92;
  botella.giro += botella.velocidadGiro * factor;
  botella.velocidadGiro *= 0.96;

  // Que no se salga de la cancha
  if (botella.x < 30 || botella.x > ANCHO - 30) botella.vx *= -1;
  if (botella.y < 20 || botella.y > ALTO - 20) botella.vy *= -1;
  botella.x = limitar(botella.x, 30, ANCHO - 30);
  botella.y = limitar(botella.y, 20, ALTO - 20);
}

// Si la pelota le pega a la botella, la pelota sale desviada y la botella rueda
function revisarBotella() {
  if (!botella || botella.fase !== 'piso' || botella.pausaChoque > 0) return;
  if (Math.hypot(pelota.x - botella.x, pelota.y - botella.y) > pelota.radio + BOTELLA_RADIO) return;

  botella.pausaChoque = 600;
  botella.vx = pelota.vx * 0.5;
  botella.vy = pelota.vy * 0.5;
  botella.velocidadGiro = (Math.random() < 0.5 ? -1 : 1) * alAzar(0.3, 0.5);
  sonidoBotella();
  desviarPelota('azar', '¡Pegó en la botella!', COLORES.botella);
}

function actualizarAseador(factor, ms) {
  if (!aseador) return;
  aseador.paso += factor;
  aseador.pausaChoque = Math.max(0, aseador.pausaChoque - ms);

  if (aseador.fase === 'esperando') {
    aseador.retraso -= ms;
    if (aseador.retraso <= 0) {
      aseador.fase = 'caminando';
      mostrarMensaje('¡Llegó el señor del aseo!', COLORES.aseo);
      anunciar('Llegó el señor del aseo a recoger la botella.');
    }
  } else if (aseador.fase === 'caminando') {
    if (!botella) {
      aseador.fase = 'saliendo';
      return;
    }
    // Se para al ladito de la botella para barrerla
    if (caminarHacia(aseador, botella.x - 24, botella.y - 6, ASEADOR_VELOCIDAD, factor)) {
      aseador.fase = 'barriendo';
      sonidoBarrer();
    }
  } else if (aseador.fase === 'barriendo') {
    if (!botella) {
      aseador.fase = 'saliendo';
      return;
    }
    // Si la botella rodó lejos, va otra vez por ella
    if (Math.hypot(aseador.x - (botella.x - 24), aseador.y - (botella.y - 6)) > 12) {
      aseador.fase = 'caminando';
      return;
    }
    aseador.barrer -= ms;
    if (aseador.barrer <= 0) {
      crearParticulas(botella.x, botella.y, COLORES.botella, 10, 2);
      botella = null; // la recogió
      aseador.fase = 'saliendo';
    }
  } else if (aseador.fase === 'saliendo') {
    if (caminarHacia(aseador, aseador.x, aseador.entradaY, ASEADOR_VELOCIDAD, factor)) {
      aseador = null;
    }
  }
}

// ----- Jugador que cruza la cancha calentando (a veces se tropieza) -----
function aparecerJugadorCruza() {
  const bajando = Math.random() < 0.5;
  const equipo = Math.random() < 0.5 ? 'jugador' : 'maquina';
  jugadorCruza = {
    x: alAzar(ANCHO * 0.25, ANCHO * 0.75),
    y: bajando ? -45 : ALTO + 45,
    vy: bajando ? 3 : -3,
    color: equipo === 'jugador' ? COLORES.jugador : COLORES.maquina,
    numero: Math.floor(alAzar(2, 99)),
    piel: elegir(TONOS_PIEL),
    // 4 de cada 10 veces se tropieza a mitad de cancha
    tropiezoY: Math.random() < 0.4 ? alAzar(ALTO * 0.35, ALTO * 0.65) : null,
    caido: 0,
    paso: 0,
    pausaChoque: 0
  };
  const textos = {
    baloncesto: '¡Un jugador calentando!',
    futbol: '¡Un jugador se coló!',
    hockey: '¡Un jugador patinando!'
  };
  mostrarMensaje(textos[cancha], jugadorCruza.color);
  anunciar('Un jugador está cruzando la cancha.');
}

function actualizarJugadorCruza(factor, ms) {
  const j = jugadorCruza;
  if (!j) return;
  j.paso += factor;
  j.pausaChoque = Math.max(0, j.pausaChoque - ms);

  if (j.caido > 0) {
    j.caido -= ms;
    if (j.caido <= 0) j.caido = -1; // ya se levantó, no se vuelve a caer
    return;
  }

  j.y += j.vy * factor;

  // ¿Se tropieza aquí?
  if (j.tropiezoY !== null && j.caido === 0 && Math.abs(j.y - j.tropiezoY) < Math.abs(j.vy * factor) + 1) {
    j.caido = 1100;
    mostrarMensaje('¡Se cayó! 😅', j.color);
    sonidoBoing();
  }

  if (j.y < -60 || j.y > ALTO + 60) jugadorCruza = null;
}

// ----- Señor del aseo cruzando con el trapero (deja el piso brillante) -----
function aparecerTrapeador() {
  const bajando = Math.random() < 0.5;
  const x = alAzar(ANCHO * 0.3, ANCHO * 0.7);
  trapeador = {
    x,
    baseX: x,
    y: bajando ? -45 : ALTO + 45,
    vy: bajando ? 1.7 : -1.7,
    paso: 0,
    pausaChoque: 0,
    rastro: []
  };
  mostrarMensaje('¡Piso mojado!', COLORES.aseo);
  sonidoBarrer();
  anunciar('El señor del aseo está trapeando la cancha.');
}

function actualizarTrapeador(factor, ms) {
  const t = trapeador;
  if (!t) return;
  t.paso += factor;
  t.pausaChoque = Math.max(0, t.pausaChoque - ms);
  t.y += t.vy * factor;
  t.x = t.baseX + Math.sin(t.paso * 0.05) * 28; // trapea en zigzag

  // Rastro mojado que se va secando
  if (Math.floor(t.paso) % 4 === 0) t.rastro.push({ x: t.x + 22, y: t.y + 30, vida: 1 });
  t.rastro.forEach((m) => { m.vida -= 0.006 * factor; });
  t.rastro = t.rastro.filter((m) => m.vida > 0);

  if ((t.y < -60 || t.y > ALTO + 60) && t.rastro.length === 0) trapeador = null;
}

function dibujarRastroMojado() {
  if (!trapeador) return;
  ctx.fillStyle = '#bfe6ff';
  trapeador.rastro.forEach((m) => {
    ctx.globalAlpha = m.vida * 0.35;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function dibujarTrapeador() {
  const t = trapeador;
  if (!t || t.y < -55 || t.y > ALTO + 55) return;
  dibujarSenorAseo(t, 'trapero', true, true);
}

function dibujarJugadorCruza() {
  const j = jugadorCruza;
  if (!j) return;
  const caido = j.caido > 0;
  const mov = reducirMovimiento || caido ? 0 : Math.sin(j.paso * 0.5) * 4;

  ctx.save();
  ctx.translate(j.x, j.y);
  ctx.scale(1.7, 1.7);
  if (caido) ctx.rotate(Math.PI / 2); // acostado en el piso

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piernas
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, 12);
  ctx.lineTo(-3 - mov, 19);
  ctx.moveTo(3, 12);
  ctx.lineTo(3 + mov, 19);
  ctx.stroke();

  // Brazos
  ctx.strokeStyle = j.piel;
  ctx.beginPath();
  ctx.moveTo(-6, 5);
  ctx.lineTo(-9 + mov, 13);
  ctx.moveTo(6, 5);
  ctx.lineTo(10, caido ? 2 : 11);
  ctx.stroke();

  // Lo que lleva según la cancha
  if (cancha === 'hockey') {
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(14, 21);
    ctx.lineTo(19, 21);
    ctx.stroke();
  } else {
    const bote = cancha === 'baloncesto' && !caido && !reducirMovimiento ? Math.abs(Math.sin(j.paso * 0.25)) * 6 : 0;
    ctx.fillStyle = cancha === 'futbol' ? '#ffffff' : COLORES.pelota;
    ctx.strokeStyle = COLORES.contorno;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cancha === 'futbol' ? 5 : 12, cancha === 'futbol' ? 21 : 13 + bote, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Camiseta con número
  ctx.fillStyle = j.color;
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 8, 8, Math.PI, 0);
  ctx.lineTo(8, 13);
  ctx.lineTo(-8, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORES.contorno;
  ctx.font = '700 6px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(j.numero), 0, 9);

  // Cabeza (con estrellitas si se cayó)
  ctx.fillStyle = j.piel;
  ctx.beginPath();
  ctx.arc(0, -1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (caido) {
    ctx.fillStyle = COLORES.borde;
    ctx.font = '7px system-ui, sans-serif';
    ctx.fillText('✦', -6, -8);
    ctx.fillText('✦', 6, -9);
  }

  ctx.restore();
}

/* =====================================================================
   10. Pelota y paletas
   ===================================================================== */
// direccion -1 = hacia la izquierda, 1 = hacia la derecha
function sacarPelota(direccion = -1) {
  pelota.x = ANCHO / 2;
  pelota.y = ALTO / 2;
  const angulo = (Math.random() * 60 - 30) * (Math.PI / 180);
  const velocidad = nivel.velocidadInicial + bonoVelocidad;
  pelota.vx = direccion * velocidad * Math.cos(angulo);
  pelota.vy = velocidad * Math.sin(angulo);

  maquina.distraida = false;
  maquina.yaDecidio = false;
  maquina.desfase = 0;
  ultimoGolpe = direccion < 0 ? 'maquina' : 'jugador'; // el saque "lo hizo" el otro lado
}

// Cambia la dirección según en qué parte de la paleta pegó la pelota
function rebotar(paleta, direccion) {
  const centro = paleta.y + paleta.alto / 2;
  const impacto = limitar((pelota.y - centro) / (paleta.alto / 2), -1, 1);
  const angulo = impacto * (Math.PI / 4);
  const tope = nivel.velocidadMaxima + bonoVelocidad;
  const velocidad = Math.min(Math.hypot(pelota.vx, pelota.vy) * nivel.aceleracion, tope);

  pelota.vx = direccion * velocidad * Math.cos(angulo);
  pelota.vy = velocidad * Math.sin(angulo);
}

function tocaPaleta(paleta) {
  return (
    pelota.x + pelota.radio >= paleta.x &&
    pelota.x - pelota.radio <= paleta.x + PALETA_ANCHO &&
    pelota.y + pelota.radio >= paleta.y &&
    pelota.y - pelota.radio <= paleta.y + paleta.alto
  );
}

function moverMaquina(factor) {
  if (maquina.distraida) {
    maquina.y += maquina.huida * VELOCIDAD_DISTRAIDA * factor; // se aleja de la pelota
  } else {
    maquina.y = pelota.y - maquina.alto / 2 + maquina.desfase; // la sigue exacto
  }
  maquina.y = limitar(maquina.y, 0, ALTO - maquina.alto);
}

// Sirve para Petunia y para el jugador 2: es la paleta de la derecha
function devolverConMaquina() {
  ultimoGolpe = 'maquina';
  sumarRally();
  tiempoSinGolpe = 0;
  pelota.x = maquina.x - pelota.radio;
  rebotar(maquina, -1);
  maquina.distraida = false;
  maquina.brillo = 1;
  crearParticulas(pelota.x, pelota.y, COLORES.maquina, 12, 3);
  sonidoGolpe(false);
}

/* =====================================================================
   11. Lógica de cada cuadro
   ===================================================================== */
function moverConTeclas(paleta, teclas, factor) {
  // Congelada por el poder de hielo: no se mueve
  if (paleta.congelado) {
    paleta.velTeclado = 0;
    return;
  }

  const direccion = (teclas.abajo ? 1 : 0) - (teclas.arriba ? 1 : 0);
  if (direccion !== 0) paleta.objetivoY = null; // el teclado manda

  // Acelera poco a poco hasta la velocidad máxima, y frena rápido al soltar o cambiar de dirección
  const actual = paleta.velTeclado || 0;
  const deseada = direccion * VELOCIDAD_JUGADOR;
  const frenando = direccion === 0 || Math.sign(deseada) !== Math.sign(actual);
  const rapidez = frenando ? FRENADO_TECLADO : ACELERACION_TECLADO;
  paleta.velTeclado = actual + (deseada - actual) * Math.min(1, rapidez * factor);
  if (Math.abs(paleta.velTeclado) < 0.05) paleta.velTeclado = 0;
  paleta.y += paleta.velTeclado * factor;
  if (paleta.y <= 0 || paleta.y >= ALTO - paleta.alto) paleta.velTeclado = 0;

  // Con mouse o dedo, la paleta no salta: se acerca poco a poco a donde está el puntero
  if (paleta.objetivoY !== null && paleta.objetivoY !== undefined) {
    const suavidad = paleta.suavidad || SUAVIDAD_PUNTERO;
    paleta.y += (paleta.objetivoY - paleta.y) * Math.min(1, suavidad * factor);
  }
  paleta.y = limitar(paleta.y, 0, ALTO - paleta.alto);
}

function actualizar(factor) {
  moverConTeclas(jugador, teclas1, factor);
  if (modo === 'dos') moverConTeclas(maquina, teclas2, factor);

  actualizarPoderes(factor * MS_POR_CUADRO);
  actualizarPeligros(factor);

  if (pelotasExtra.length) {
    moverPelotasExtra(factor);
    if (!jugando) return;
  }

  if (enSaque) return;

  const distancia = Math.hypot(pelota.vx, pelota.vy) * multiplicadorVelocidad() * factor;
  const pasos = Math.max(1, Math.ceil(distancia / PASO_MAXIMO));
  for (let i = 0; i < pasos && !enSaque && jugando; i++) {
    moverPelota(factor / pasos);
  }

  pelota.giro += pelota.vx * 0.02 * factor;

  // Vigilante: si algo raro deja la pelota mal (o lleva mucho sin tocar una canasta),
  // se vuelve a sacar desde el centro. Así ninguna jugada se queda colgada.
  tiempoSinGolpe += factor * MS_POR_CUADRO;
  const pelotaRara = !Number.isFinite(pelota.x) || !Number.isFinite(pelota.y) || Math.abs(pelota.vx) < 0.5;
  if (!enSaque && (pelotaRara || tiempoSinGolpe > 15000)) {
    mostrarMensaje('¡Pelota nueva!', COLORES.lineas);
    pelota.radio = efectoActivo && efectoActivo.tipo === 'mini' ? RADIO_MINI : RADIO_NORMAL;
    prepararSaque(-1);
  }
}

function moverPelota(factor) {
  const r = pelota.radio;

  // El viento empuja la pelota hacia arriba o abajo sin cambiar su velocidad
  if (viento) {
    const velocidad = Math.hypot(pelota.vx, pelota.vy);
    pelota.vy += viento.direccion * nivel.fuerzaViento * factor;
    ajustarAngulo(Math.atan2(pelota.vy, Math.abs(pelota.vx)), velocidad);
  }

  // Zigzag: la pelota ondula de un lado al otro sin cambiar su velocidad
  if (efectoActivo && efectoActivo.tipo === 'zigzag') {
    const velocidad = Math.hypot(pelota.vx, pelota.vy);
    pelota.vy += Math.cos(reloj * 0.012) * 0.55 * factor;
    ajustarAngulo(Math.atan2(pelota.vy, Math.abs(pelota.vx)), velocidad);
  }

  const mult = multiplicadorVelocidad();
  pelota.x += pelota.vx * mult * factor;
  pelota.y += pelota.vy * mult * factor;

  // Rebote en los bordes de arriba y abajo
  if (pelota.y - r < 0) {
    pelota.y = r;
    pelota.vy = Math.abs(pelota.vy);
    crearParticulas(pelota.x, 0, COLORES.pelota, 6, 3);
  }
  if (pelota.y + r > ALTO) {
    pelota.y = ALTO - r;
    pelota.vy = -Math.abs(pelota.vy);
    crearParticulas(pelota.x, ALTO, COLORES.pelota, 6, 3);
  }

  revisarPoder();
  revisarBotella();
  if (jugadorCruza && !jugadorCruza.caido) {
    revisarChoque(jugadorCruza, CRUZANTE_RADIO, 'azar', '¡Choque con el jugador!', jugadorCruza.color);
  }
  revisarChoque(trapeador, CRUZANTE_RADIO, 'azar', '¡Cuidado, piso mojado!', COLORES.aseo);
  revisarChoque(aseador, ASEADOR_RADIO, 'azar', '¡Le pegó al del aseo!', COLORES.aseo);
  revisarChoque(aficionado, AFICIONADO_RADIO, 'devolver', '¡Uy!', COLORES.borde);
  revisarChoque(celador, CELADOR_RADIO, 'azar', '¡Auch!', COLORES.chaleco);
  revisarChoque(dron, DRON_RADIO, 'azar', '¡Le pegó al dron!', COLORES.lineas);

  // Solo contra Petunia: ¿se distrae esta vez? Se decide una sola vez por jugada
  if (modo === 'uno') {
    if (pelota.vx > 0 && !maquina.yaDecidio && pelota.x > ZONA_DISTRACCION) {
      maquina.yaDecidio = true;
      if (Math.random() < nivel.distraccion) {
        maquina.distraida = true;
        maquina.huida = maquina.y + maquina.alto / 2 >= pelota.y ? 1 : -1;
      }
    }
    if (!maquina.congelado) moverMaquina(factor);
  }

  // Choque con tu paleta
  if (pelota.vx < 0 && pelota.x > jugador.x && tocaPaleta(jugador)) {
    pelota.x = jugador.x + PALETA_ANCHO + r;
    rebotar(jugador, 1);
    ultimoGolpe = 'jugador';
    sumarRally();
    tiempoSinGolpe = 0;
    jugador.brillo = 1;
    crearParticulas(pelota.x, pelota.y, COLORES.jugador, 12, 3);
    sonidoGolpe(true);
    maquina.desfase = alAzar(-nivel.punteria, nivel.punteria);
    maquina.yaDecidio = false;
  }

  // Paleta derecha
  if (pelota.vx > 0) {
    const tocaDerecha = pelota.x < maquina.x + PALETA_ANCHO && tocaPaleta(maquina);
    if (modo === 'dos') {
      // El jugador 2 solo la devuelve si de verdad la toca
      if (tocaDerecha) devolverConMaquina();
    } else if (!maquina.distraida && !maquina.congelado && pelota.x + r >= maquina.x) {
      // Petunia concentrada devuelve SIEMPRE
      devolverConMaquina();
    } else if ((maquina.distraida || maquina.congelado) && tocaDerecha) {
      // distraída o congelada: solo si la pelota le pega
      devolverConMaquina();
    }
  }

  // Escudo: una barrera en la línea de fondo que salva UN punto
  if (efectoActivo && efectoActivo.tipo === 'escudo') {
    const lado = efectoActivo.lado;
    if (lado === 'jugador' && pelota.vx < 0 && pelota.x - r <= 4) {
      pelota.x = 4 + r;
      pelota.vx = Math.abs(pelota.vx);
      usarEscudo();
    } else if (lado === 'maquina' && pelota.vx > 0 && pelota.x + r >= ANCHO - 4) {
      pelota.x = ANCHO - 4 - r;
      pelota.vx = -Math.abs(pelota.vx);
      usarEscudo();
    }
  }

  if (pelota.x - r > ANCHO) {
    puntoIzquierda();
    return;
  }
  if (pelota.x + r < 0) {
    puntoDerecha();
  }
}

function usarEscudo() {
  crearParticulas(pelota.x, pelota.y, COLORES.escudo, 24, 5);
  mostrarMensaje('¡Lo salvó el escudo!', COLORES.escudo);
  anunciar('El escudo salvó el punto.');
  sonidoEscudo();
  tiempoSinGolpe = 0;
  terminarEfecto();
}

/* =====================================================================
   12. Puntos y saque
   ===================================================================== */
// Festejo completo: gato de fiesta, serpentinas, hinchada y sonido feliz
function festejarPunto(lado) {
  celebrar(lado);
  lanzarSerpentinas();
  mostrarFestejo(lado === 'jugador' ? 'izquierda' : 'derecha');
  sonidoFeliz();
}

// La pelota salió por la derecha: punto para ti (o para el jugador 1)
// origen: la pelota que hizo el punto (la principal o una extra del multibola)
function puntoIzquierda(origen = pelota) {
  if (origen === pelota) cerrarRally();
  puntosIzquierda++;
  actualizarMarcador();
  animarNumero(marcadorJugador);
  efectoPunto(ANCHO - 10, origen.y, COLORES.jugador, `¡Punto de ${nombreJugador}!`);

  // En 2 jugadores, el primero que llegue a 5 gana y se acaba
  if (modo === 'dos' && puntosIzquierda >= META) {
    celebrar('jugador', false);
    terminarJuego();
    return;
  }

  // Contra Petunia: al llegar a 5 le ganaste, ¡festejo grande! pero se sigue jugando
  // (la partida solo se acaba cuando Petunia llegue a 5)
  if (modo === 'uno' && puntosIzquierda >= META && !yaLeGanaste) {
    yaLeGanaste = true;
    festejarPunto('jugador');
    lanzarSerpentinas();
    sonidoAplausos(2.5);
    mostrarMensaje(`¡Le ganaste a ${NOMBRE_MAQUINA}!`, COLORES.jugador);
    anunciar(`¡Le ganaste a ${NOMBRE_MAQUINA}! Sigue jugando: la partida termina cuando ${NOMBRE_MAQUINA} llegue a ${META}.`);
    if (origen === pelota) prepararSaque(1);
    return;
  }

  // En 2 jugadores, cada punto acelera la pelota
  if (modo === 'dos') subirVelocidad();

  festejarPunto('jugador');
  anunciar(`¡Punto para ${nombreJugador}!`);
  if (origen === pelota) prepararSaque(1); // saca hacia el que perdió el punto
}

// La pelota salió por la izquierda: punto para Petunia (o para el jugador 2)
function puntoDerecha(origen = pelota) {
  if (origen === pelota) cerrarRally();
  puntosDerecha++;
  actualizarMarcador();
  animarNumero(marcadorMaquina);

  if (modo === 'dos') {
    efectoPunto(10, origen.y, COLORES.maquina, `¡Punto de ${nombreJugador2}!`);
    if (puntosDerecha >= META) {
      celebrar('maquina', false);
      terminarJuego();
      return;
    }
    subirVelocidad();
    festejarPunto('maquina');
    anunciar(`¡Punto para ${nombreJugador2}!`);
    if (origen === pelota) prepararSaque(-1);
    return;
  }

  efectoPunto(10, origen.y, COLORES.maquina, `¡Punto de ${NOMBRE_MAQUINA}!`);
  const seAcabo = puntosDerecha >= INTENTOS;
  celebrar('maquina', !seAcabo); // en el último punto suena la risa, no los aplausos

  if (seAcabo) {
    terminarJuego();
    return;
  }

  // Cada punto de Petunia hace la pelota un poquito más rápida
  subirVelocidad();

  // El gato se burla de ti
  mostrarBurla();
  sonidoBurla();
  const restantes = INTENTOS - puntosDerecha;
  anunciar(restantes === 1 ? 'Fallaste. Te queda 1 intento.' : `Fallaste. Te quedan ${restantes} intentos.`);
  if (origen === pelota) prepararSaque(-1);
}

// Suma velocidad según el nivel (fácil sube poquito, difícil sube más)
function subirVelocidad() {
  bonoVelocidad += nivel.aumentoPorPunto;
}

function prepararSaque(direccion, espera = 900) {
  enSaque = true;
  tiempoSinGolpe = 0;
  maquina.distraida = false;
  pelota.x = ANCHO / 2;
  pelota.y = ALTO / 2;
  temporizadorSaque = setTimeout(() => {
    sacarPelota(direccion);
    enSaque = false;
  }, espera);
}

/* =====================================================================
   13. Dibujo de la cancha y de cada cosa
   ===================================================================== */
function dibujarPiso() {
  const altoTabla = 25;
  for (let y = 0; y < ALTO; y += altoTabla) {
    ctx.fillStyle = (y / altoTabla) % 2 === 0 ? COLORES.piso : COLORES.pisoTabla;
    ctx.fillRect(0, y, ANCHO, altoTabla);
  }
}

function dibujarMediaCancha(lado) {
  const espejo = lado === 'jugador' ? 1 : -1;
  const origen = lado === 'jugador' ? 0 : ANCHO;
  const colorZona = lado === 'jugador' ? COLORES.jugador : COLORES.maquina;
  const centroY = ALTO / 2;

  ctx.save();
  ctx.translate(origen, 0);
  ctx.scale(espejo, 1);

  // Zona pintada
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colorZona;
  ctx.fillRect(0, centroY - 80, 150, 160);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = COLORES.lineas;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, centroY - 80, 150, 160);

  // Círculo de tiro libre
  ctx.beginPath();
  ctx.arc(150, centroY, 60, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Línea de 3 puntos
  const radioTriple = 215;
  const angulo = Math.asin(210 / radioTriple);
  const xCorte = 45 + Math.cos(angulo) * radioTriple;
  ctx.beginPath();
  ctx.moveTo(0, centroY - 210);
  ctx.lineTo(xCorte, centroY - 210);
  ctx.arc(45, centroY, radioTriple, -angulo, angulo);
  ctx.lineTo(0, centroY + 210);
  ctx.stroke();

  ctx.restore();
}

// ----- Fútbol: césped a franjas, áreas, punto penal y arcos de esquina -----
function dibujarCanchaFutbol() {
  const franja = 50;
  for (let x = 0; x < ANCHO; x += franja) {
    ctx.fillStyle = (x / franja) % 2 === 0 ? COLORES.cesped : COLORES.cespedFranja;
    ctx.fillRect(x, 0, franja, ALTO);
  }

  ctx.strokeStyle = COLORES.lineas;
  ctx.fillStyle = COLORES.lineas;
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, ANCHO - 6, ALTO - 6);

  // Mitad de la cancha
  ctx.beginPath();
  ctx.moveTo(ANCHO / 2, 0);
  ctx.lineTo(ANCHO / 2, ALTO);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ANCHO / 2, ALTO / 2, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ANCHO / 2, ALTO / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Cada lado (el derecho es el izquierdo en espejo)
  ['jugador', 'maquina'].forEach((lado) => {
    ctx.save();
    if (lado === 'maquina') {
      ctx.translate(ANCHO, 0);
      ctx.scale(-1, 1);
    }
    ctx.strokeRect(3, ALTO / 2 - 140, 110, 280); // área grande
    ctx.strokeRect(3, ALTO / 2 - 65, 40, 130);   // área chica
    ctx.beginPath();
    ctx.arc(80, ALTO / 2, 4, 0, Math.PI * 2);     // punto penal
    ctx.fill();
    const corte = Math.acos(30 / 60);
    ctx.beginPath();
    ctx.arc(80, ALTO / 2, 60, -corte, corte);     // medialuna
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, 3, 14, 0, Math.PI / 2);            // esquinas
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, ALTO - 3, 14, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.restore();
  });
}

// ----- Hockey de mesa: mesa clara con hoyitos de aire, líneas roja y azules -----
function dibujarMesaHockey() {
  ctx.fillStyle = COLORES.hielo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Hoyitos por donde sale el aire
  ctx.fillStyle = COLORES.hoyitos;
  for (let x = 20; x < ANCHO; x += 25) {
    for (let y = 20; y < ALTO; y += 25) {
      ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
    }
  }

  // Líneas azules
  ctx.strokeStyle = COLORES.hockeyAzul;
  ctx.lineWidth = 5;
  [ANCHO * 0.3, ANCHO * 0.7].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ALTO);
    ctx.stroke();
  });

  // Línea y círculo central rojos
  ctx.strokeStyle = COLORES.hockeyRojo;
  ctx.fillStyle = COLORES.hockeyRojo;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ANCHO / 2, 0);
  ctx.lineTo(ANCHO / 2, ALTO);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ANCHO / 2, ALTO / 2, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ANCHO / 2, ALTO / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  // Áreas de portería y círculos de saque en cada lado
  ['jugador', 'maquina'].forEach((lado) => {
    ctx.save();
    if (lado === 'maquina') {
      ctx.translate(ANCHO, 0);
      ctx.scale(-1, 1);
    }
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORES.hockeyAzul;
    ctx.beginPath();
    ctx.arc(0, ALTO / 2, 75, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORES.hockeyRojo;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, ALTO / 2, 75, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    [ALTO * 0.25, ALTO * 0.75].forEach((y) => {
      ctx.beginPath();
      ctx.arc(170, y, 32, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  });

  // Baranda de la mesa
  ctx.strokeStyle = COLORES.baranda;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, ANCHO - 8, ALTO - 8);
}

// Dibuja el piso y las líneas de la cancha elegida en el lienzo aparte
function generarFondo() {
  ctx = fondo.getContext('2d');
  ctx.clearRect(0, 0, ANCHO, ALTO);
  if (cancha === 'futbol') {
    dibujarCanchaFutbol();
  } else if (cancha === 'hockey') {
    dibujarMesaHockey();
  } else {
    dibujarPiso();
    dibujarMediaCancha('jugador');
    dibujarMediaCancha('maquina');
    dibujarLineasCentro();
  }
  ctx = ctxPrincipal;

  // Versión girada (se hace una sola vez por cancha)
  const v = fondoVertical.getContext('2d');
  v.setTransform(1, 0, 0, 1, 0, 0);
  v.clearRect(0, 0, fondoVertical.width, fondoVertical.height);
  v.translate(0, ANCHO);
  v.rotate(-Math.PI / 2);
  v.drawImage(fondo, 0, 0);
  v.setTransform(1, 0, 0, 1, 0, 0);
}

function dibujarLineasCentro() {
  ctx.strokeStyle = COLORES.lineas;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, ANCHO - 3, ALTO - 3);

  ctx.beginPath();
  ctx.moveTo(ANCHO / 2, 0);
  ctx.lineTo(ANCHO / 2, ALTO);
  ctx.stroke();

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORES.borde;
  ctx.beginPath();
  ctx.arc(ANCHO / 2, ALTO / 2, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
}

// Rectángulo con esquinas redondeadas (sirve en navegadores viejos que no tienen roundRect)
function rectRedondeado(x, y, ancho, alto, radio) {
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
  ctx.arcTo(x, y + alto, x, y, radio);
  ctx.arcTo(x, y, x + ancho, y, radio);
  ctx.closePath();
}

// Las "barras" son canastas de baloncesto: un tablero que se mueve,
// con su aro y su red vistos desde arriba.
// La zona que golpea la pelota sigue siendo el rectángulo del tablero.
// mira: 1 = el aro apunta a la derecha (lado izquierdo), -1 = apunta a la izquierda
// Cada cancha tiene su "paleta": canasta, portería o mazo de hockey.
// En todas, lo que golpea la pelota es el mismo rectángulo.
function dibujarPaleta(paleta, color, mira) {
  if (cancha === 'futbol') dibujarPorteria(paleta, color, mira);
  else if (cancha === 'hockey') dibujarMazo(paleta, color);
  else dibujarCanasta(paleta, color, mira);
}

// ----- Portería de fútbol: travesaño que golpea + red hacia la pared -----
function dibujarPorteria(paleta, color, mira) {
  const media = paleta.alto / 2;
  const fondoRed = -mira * 18; // la red queda detrás, hacia la gradería

  ctx.save();
  ctx.translate(paleta.x + PALETA_ANCHO / 2, paleta.y + media);

  // Red con cuadritos del color del equipo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(Math.min(0, fondoRed), -media, 18, paleta.alto);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; Math.abs(x) <= 18; x -= mira * 4.5) {
    ctx.moveTo(x, -media);
    ctx.lineTo(x, media);
  }
  for (let y = -media; y <= media; y += 6) {
    ctx.moveTo(0, y);
    ctx.lineTo(fondoRed, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Palos de los lados (de la línea hacia el fondo)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -media);
  ctx.lineTo(fondoRed, -media + 3);
  ctx.moveTo(0, media);
  ctx.lineTo(fondoRed, media - 3);
  ctx.stroke();

  // Travesaño blanco con franjas del equipo (lo que golpea la pelota)
  ctx.shadowColor = color;
  ctx.shadowBlur = ligero ? 0 : 12 + paleta.brillo * 30;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  rectRedondeado(-4.5, -media, 9, paleta.alto, 3);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  for (let y = -media + 8; y < media - 8; y += 16) {
    ctx.fillRect(-4.5, y, 9, 8);
  }
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rectRedondeado(-4.5, -media, 9, paleta.alto, 3);
  ctx.stroke();

  // Postes en las puntas
  [-media, media].forEach((y) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

// ----- Mazo de hockey de mesa: una píldora con perilla en el centro -----
function dibujarMazo(paleta, color) {
  const media = paleta.alto / 2;
  const escala = 1 + paleta.brillo * 0.06;

  ctx.save();
  ctx.translate(paleta.x + PALETA_ANCHO / 2, paleta.y + media);
  ctx.scale(escala, escala);

  ctx.shadowColor = color;
  ctx.shadowBlur = ligero ? 0 : 12 + paleta.brillo * 30;
  ctx.fillStyle = color;
  ctx.beginPath();
  rectRedondeado(-9, -media, 18, paleta.alto, 9);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Anillo interior más claro
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  rectRedondeado(-5, -media + 6, 10, paleta.alto - 12, 5);
  ctx.stroke();

  // Perilla para agarrarlo
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORES.contorno;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(-2.5, -2.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ----- Canasta de baloncesto -----
function dibujarCanasta(paleta, color, mira) {
  const cx = paleta.x + PALETA_ANCHO / 2;
  const cy = paleta.y + paleta.alto / 2;
  const media = paleta.alto / 2;
  const mitadAncho = PALETA_ANCHO / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // ----- Soporte que une el tablero con el aro -----
  const radioAro = 13 * (1 + paleta.brillo * 0.15); // el aro "tiembla" al golpear
  const xAro = mira * (mitadAncho + 4 + radioAro);
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(mira * mitadAncho, 0);
  ctx.lineTo(xAro - mira * radioAro, 0);
  ctx.stroke();

  // ----- Red vista desde arriba: un aro más pequeño abajo y cuerdas cruzadas -----
  const radioRed = radioAro * 0.5;

  // Sombrita de la red sobre el piso, para que resalte
  ctx.fillStyle = 'rgba(27, 15, 46, 0.25)';
  ctx.beginPath();
  ctx.arc(xAro, 0, radioAro, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angulo = (i / 10) * Math.PI * 2;
    const desvio = Math.PI / 10;
    const xBorde = xAro + Math.cos(angulo) * radioAro;
    const yBorde = Math.sin(angulo) * radioAro;
    // cada cuerda baja en diagonal hacia los dos lados: forma los rombos de la red
    ctx.moveTo(xBorde, yBorde);
    ctx.lineTo(xAro + Math.cos(angulo + desvio) * radioRed, Math.sin(angulo + desvio) * radioRed);
    ctx.moveTo(xBorde, yBorde);
    ctx.lineTo(xAro + Math.cos(angulo - desvio) * radioRed, Math.sin(angulo - desvio) * radioRed);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(xAro, 0, radioRed, 0, Math.PI * 2);
  ctx.stroke();

  // ----- Aro naranja -----
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(xAro, 0, radioAro, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COLORES.aro;
  ctx.lineWidth = 3;
  ctx.stroke();

  // ----- Tablero (lo que golpea la pelota) -----
  const extra = paleta.brillo * 2;
  const x = -mitadAncho - extra / 2;
  const y = -media - extra;
  const ancho = PALETA_ANCHO + extra;
  const alto = paleta.alto + extra * 2;

  ctx.shadowColor = color;
  ctx.shadowBlur = ligero ? 0 : 12 + paleta.brillo * 30;
  ctx.fillStyle = '#f7f7fb';
  ctx.beginPath();
  rectRedondeado(x, y, ancho, alto, 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Marco del color del equipo
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  rectRedondeado(x + 1.5, y + 1.5, ancho - 3, alto - 3, 2);
  ctx.stroke();

  // Cuadrito de tiro en el centro del tablero
  ctx.lineWidth = 2;
  ctx.strokeRect(-3, -14, 6, 28);

  // Contorno oscuro para que se vea sobre la madera
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rectRedondeado(x, y, ancho, alto, 3);
  ctx.stroke();

  ctx.restore();
}

// Barrera brillante en la línea de fondo de quien tiene el escudo
function dibujarEscudo() {
  if (!efectoActivo || efectoActivo.tipo !== 'escudo') return;
  const x = efectoActivo.lado === 'jugador' ? 0 : ANCHO - 7;
  const pulso = reducirMovimiento ? 0.8 : 0.55 + Math.sin(reloj * 0.01) * 0.3;
  ctx.save();
  ctx.globalAlpha = pulso;
  ctx.fillStyle = COLORES.escudo;
  ctx.fillRect(x, 0, 7, ALTO);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = efectoActivo.lado === 'jugador' ? COLORES.jugador : COLORES.maquina;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, 0, 7, ALTO);
  ctx.restore();
}

// Capa de hielo encima de la canasta congelada
function dibujarHielo(paleta) {
  if (!paleta.congelado) return;
  const cx = paleta.x + PALETA_ANCHO / 2;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = COLORES.hielo;
  ctx.beginPath();
  rectRedondeado(cx - 13, paleta.y - 6, 26, paleta.alto + 12, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // copitos de nieve
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('❄', cx, paleta.y + 14);
  ctx.fillText('❄', cx, paleta.y + paleta.alto - 4);
  ctx.restore();
}

function dibujarBalon() {
  const cambiaPelota = efectoActivo && ['mini', 'turbo', 'zigzag'].includes(efectoActivo.tipo);
  const color = cambiaPelota ? colorPoder(efectoActivo.tipo) : null;
  dibujarUnaPelota(pelota.x, pelota.y, pelota.radio, pelota.giro, color);
}

// Dibuja una pelota de la cancha elegida. colorEfecto = color del poder activo (o null)
function dibujarUnaPelota(x, y, r, giro, colorEfecto) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);
  if (cancha === 'futbol') dibujarPelotaFutbol(r, colorEfecto);
  else if (cancha === 'hockey') dibujarDisco(r, colorEfecto);
  else dibujarPelotaBaloncesto(r, colorEfecto);
  ctx.restore();
}

function dibujarPelotaBaloncesto(r, colorEfecto) {
  const color = colorEfecto || COLORES.pelota;
  ctx.shadowColor = color;
  ctx.shadowBlur = ligero ? 0 : 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = COLORES.costura;
  ctx.lineWidth = r > 6 ? 1.5 : 1;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-r * 1.1, 0, r * 0.75, -Math.PI / 3, Math.PI / 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 1.1, 0, r * 0.75, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

// Balón de fútbol: blanco con un pentágono negro y parches en el borde
function dibujarPelotaFutbol(r, colorEfecto) {
  const color = colorEfecto || '#ffffff';
  ctx.shadowColor = colorEfecto || 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = ligero ? 0 : 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.clip(); // los parches no se salen del balón
  ctx.fillStyle = '#1b1b1b';
  poligono(0, 0, r * 0.42, 5);
  for (let i = 0; i < 5; i++) {
    const angulo = (i / 5) * Math.PI * 2 - Math.PI / 2;
    poligono(Math.cos(angulo) * r * 1.02, Math.sin(angulo) * r * 1.02, r * 0.38, 5);
  }
  ctx.restore();

  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

function poligono(cx, cy, radio, lados) {
  ctx.beginPath();
  for (let i = 0; i < lados; i++) {
    const angulo = (i / lados) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angulo) * radio;
    const y = cy + Math.sin(angulo) * radio;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// Disco de hockey: negro con anillo de color
function dibujarDisco(r, colorEfecto) {
  const anillo = colorEfecto || COLORES.hockeyRojo;
  ctx.shadowColor = anillo;
  ctx.shadowBlur = ligero ? 0 : 12;
  ctx.fillStyle = '#1d1d24';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = anillo;
  ctx.lineWidth = r > 6 ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function dibujarPoder() {
  if (!poder) return;
  if (!reducirMovimiento && poder.vida < 1500 && Math.floor(poder.vida / 150) % 2 === 0) return;

  const color = colorPoder(poder.tipo);
  const pulso = reducirMovimiento ? 1 : 1 + Math.sin(poder.pulso / 150) * 0.12;
  const r = PODER_RADIO * pulso;

  ctx.save();
  ctx.translate(poder.x, poder.y);

  ctx.fillStyle = COLORES.contorno;
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = color;
  ctx.shadowBlur = ligero ? 0 : 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = color;
  if (poder.tipo === 'mini') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (poder.tipo === 'multi') {
    [[-r * 0.35, r * 0.2], [r * 0.35, r * 0.2], [0, -r * 0.35]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (poder.tipo === 'gigante') {
    // flechas hacia arriba y abajo: crece
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(0, r * 0.55);
    ctx.moveTo(-r * 0.3, -r * 0.25);
    ctx.lineTo(0, -r * 0.55);
    ctx.lineTo(r * 0.3, -r * 0.25);
    ctx.moveTo(-r * 0.3, r * 0.25);
    ctx.lineTo(0, r * 0.55);
    ctx.lineTo(r * 0.3, r * 0.25);
    ctx.stroke();
  } else if (poder.tipo === 'escudo') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.45, -r * 0.35);
    ctx.lineTo(r * 0.35, r * 0.2);
    ctx.lineTo(0, r * 0.55);
    ctx.lineTo(-r * 0.35, r * 0.2);
    ctx.lineTo(-r * 0.45, -r * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (poder.tipo === 'hielo') {
    // copo de nieve
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      ctx.lineTo(-Math.cos(a) * r * 0.55, -Math.sin(a) * r * 0.55);
    }
    ctx.stroke();
  } else if (poder.tipo === 'zigzag') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.2);
    ctx.lineTo(-r * 0.25, -r * 0.25);
    ctx.lineTo(0, r * 0.2);
    ctx.lineTo(r * 0.25, -r * 0.25);
    ctx.lineTo(r * 0.55, r * 0.2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.35);
    ctx.lineTo(-r * 0.05, 0);
    ctx.lineTo(-r * 0.45, r * 0.35);
    ctx.moveTo(0, -r * 0.35);
    ctx.lineTo(r * 0.4, 0);
    ctx.lineTo(0, r * 0.35);
    ctx.stroke();
  }

  ctx.restore();
}

function dibujarBotella() {
  if (!botella) return;
  const enAire = botella.fase === 'volando';
  const escala = 1 + botella.altura / 120; // se ve más grande mientras va alto

  // Sombra en el piso (se separa de la botella cuando va por el aire)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(botella.x, botella.y + 6, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(botella.x, botella.y - botella.altura);
  ctx.rotate(botella.giro);
  ctx.scale(escala, escala);

  // Cuerpo de la botella
  ctx.fillStyle = COLORES.botella;
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-6, 13);
  ctx.quadraticCurveTo(-6, 15, -4, 15);
  ctx.lineTo(4, 15);
  ctx.quadraticCurveTo(6, 15, 6, 13);
  ctx.lineTo(6, -6);
  ctx.lineTo(2.5, -11);
  ctx.lineTo(-2.5, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Etiqueta, brillo y tapa
  ctx.fillStyle = COLORES.lineas;
  ctx.fillRect(-6, 1, 12, 5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(-4, -4, 2, 15);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-3, -15, 6, 4);
  ctx.strokeRect(-3, -15, 6, 4);

  ctx.restore();

  // Rayitas de movimiento mientras vuela
  if (enAire && !reducirMovimiento) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(botella.x, botella.y - botella.altura, 20 * escala, botella.giro, botella.giro + 1.2);
    ctx.stroke();
  }
}

function dibujarAseador() {
  if (!aseador || aseador.fase === 'esperando') return;
  dibujarSenorAseo(aseador, 'escoba', aseador.fase === 'barriendo', false);
}

// herramienta: 'escoba' o 'trapero'. trapeaYCamina: trapea mientras camina
function dibujarSenorAseo(obj, herramienta, barriendo, trapeaYCamina) {
  const caminando = !barriendo || trapeaYCamina;
  const mov = reducirMovimiento || !caminando ? 0 : Math.sin(obj.paso * 0.4) * 4;
  const escoba = barriendo && !reducirMovimiento ? Math.sin(obj.paso * 0.35) * 5 : 0;

  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.scale(1.8, 1.8);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piernas
  ctx.strokeStyle = COLORES.aseo;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, 12);
  ctx.lineTo(-3 - mov, 19);
  ctx.moveTo(3, 12);
  ctx.lineTo(3 + mov, 19);
  ctx.stroke();

  // Escoba: palo café y cerdas amarillas
  const puntaX = barriendo ? 15 + escoba : 10;
  const puntaY = barriendo ? 17 : -10;
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(barriendo ? 3 : 9, barriendo ? 2 : 16);
  ctx.lineTo(puntaX, puntaY);
  ctx.stroke();
  if (barriendo && herramienta === 'trapero') {
    // Trapero: tiras grises que se abren
    ctx.strokeStyle = '#c9c9c9';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) {
      ctx.moveTo(puntaX, puntaY - 1);
      ctx.lineTo(puntaX + i * 2, puntaY + 6);
    }
    ctx.stroke();
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.arc(puntaX, puntaY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (barriendo) {
    ctx.fillStyle = COLORES.borde;
    ctx.strokeStyle = COLORES.contorno;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(puntaX - 4, puntaY - 1);
    ctx.lineTo(puntaX + 4, puntaY - 1);
    ctx.lineTo(puntaX + 6, puntaY + 4);
    ctx.lineTo(puntaX - 6, puntaY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = COLORES.borde;
    ctx.fillRect(7, 15, 6, 5);
  }

  // Overol
  ctx.fillStyle = COLORES.aseo;
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 8, 8, Math.PI, 0);
  ctx.lineTo(8, 13);
  ctx.lineTo(-8, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Brazos agarrando la escoba
  ctx.strokeStyle = COLORES.aseo;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, 5);
  ctx.lineTo(barriendo ? 7 + escoba / 2 : 9, barriendo ? 8 : 6);
  ctx.stroke();

  // Cabeza de señor: pelo canoso y bigote
  ctx.fillStyle = '#d9a37a';
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d6d6d6';
  ctx.beginPath();
  ctx.arc(0, -2, 5.2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#9a9a9a';
  ctx.fillRect(-2.5, 1, 5, 1.5);

  ctx.restore();
}

function dibujarViento() {
  if (!viento) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, viento.restante / 500) * 0.55;
  ctx.strokeStyle = COLORES.lineas;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  viento.rayas.forEach((raya) => {
    ctx.moveTo(raya.x, raya.y);
    ctx.lineTo(raya.x, raya.y - viento.direccion * raya.largo);
  });
  ctx.stroke();
  ctx.restore();
}

function dibujarDron() {
  if (!dron) return;
  const parpadeo = Math.floor(dron.tiempo / 250) % 2 === 0;

  ctx.save();
  ctx.translate(dron.x, dron.y);

  // Sombra en el piso (está volando)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(10, 26, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brazos en X
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-15, -15);
  ctx.lineTo(15, 15);
  ctx.moveTo(15, -15);
  ctx.lineTo(-15, 15);
  ctx.stroke();

  // Hélices girando
  [[-15, -15], [15, -15], [-15, 15], [15, 15]].forEach(([hx, hy]) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORES.contorno;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const giro = dron.tiempo * 0.05;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(giro) * 8, hy + Math.sin(giro) * 8);
    ctx.lineTo(hx - Math.cos(giro) * 8, hy - Math.sin(giro) * 8);
    ctx.stroke();
  });

  // Cuerpo, cámara y luz
  ctx.fillStyle = COLORES.dron;
  ctx.fillRect(-10, -8, 20, 16);
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 2;
  ctx.strokeRect(-10, -8, 20, 16);
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(0, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = parpadeo ? '#ff3b3b' : '#3bff6b';
  ctx.beginPath();
  ctx.arc(0, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function dibujarAficionado() {
  if (!aficionado) return;
  const persona = aficionado.persona;
  const bailando = aficionado.fase === 'bailando';
  const mov = reducirMovimiento ? 0 : Math.sin(aficionado.paso * (bailando ? 0.3 : 0.5)) * 4;

  ctx.save();
  ctx.translate(aficionado.x, aficionado.y);
  ctx.scale(1.7, 1.7);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piernas
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, 12);
  ctx.lineTo(-3 - mov, 19);
  ctx.moveTo(3, 12);
  ctx.lineTo(3 + mov, 19);
  ctx.stroke();

  // Brazos: agitándose, o abajo si lo van sacando
  ctx.strokeStyle = persona.camiseta;
  ctx.beginPath();
  if (aficionado.fase === 'escoltado') {
    ctx.moveTo(-6, 4);
    ctx.lineTo(-9, 12);
    ctx.moveTo(6, 4);
    ctx.lineTo(9, 12);
  } else {
    ctx.moveTo(-6, 4);
    ctx.lineTo(-11, -9 + mov);
    ctx.moveTo(6, 4);
    ctx.lineTo(11, -9 - mov);
  }
  ctx.stroke();

  // Cuerpo
  ctx.fillStyle = persona.camiseta;
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 8, 8, Math.PI, 0);
  ctx.lineTo(8, 13);
  ctx.lineTo(-8, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cabeza
  ctx.fillStyle = persona.piel;
  ctx.beginPath();
  ctx.arc(0, -1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function dibujarCelador() {
  if (!celador || celador.fase === 'esperando') return;
  const mov = reducirMovimiento ? 0 : Math.sin(celador.paso * 0.5) * 4;
  const escoltando = celador.fase === 'escoltando';

  ctx.save();
  ctx.translate(celador.x, celador.y);
  ctx.scale(1.8, 1.8);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piernas
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, 12);
  ctx.lineTo(-3 - mov, 19);
  ctx.moveTo(3, 12);
  ctx.lineTo(3 + mov, 19);
  ctx.stroke();

  // Brazos: estirados hacia adelante si va sacando al aficionado
  ctx.strokeStyle = COLORES.celador;
  ctx.beginPath();
  if (escoltando) {
    ctx.moveTo(-6, 5);
    ctx.lineTo(-10, 2);
    ctx.moveTo(6, 5);
    ctx.lineTo(10, 2);
  } else {
    ctx.moveTo(-6, 5);
    ctx.lineTo(-8 + mov, 13);
    ctx.moveTo(6, 5);
    ctx.lineTo(8 - mov, 13);
  }
  ctx.stroke();

  // Uniforme con franja de chaleco
  ctx.fillStyle = COLORES.celador;
  ctx.strokeStyle = COLORES.contorno;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 8, 8, Math.PI, 0);
  ctx.lineTo(8, 13);
  ctx.lineTo(-8, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORES.chaleco;
  ctx.fillRect(-8, 7, 16, 2.5);

  // Cabeza y gorra
  ctx.fillStyle = '#e0ac69';
  ctx.beginPath();
  ctx.arc(0, -1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(0, -2, 5.2, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-1, -3, 8, 2);

  ctx.restore();
}

function dibujarParticulas() {
  particulas.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.vida);
    if (p.serpentina) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const l = p.tamano / 2;
      ctx.beginPath();
      ctx.moveTo(-l, 0);
      ctx.quadraticCurveTo(-l / 2, -6, 0, 0);
      ctx.quadraticCurveTo(l / 2, 6, l, 0);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.tamano, p.tamano);
    }
  });
  ctx.globalAlpha = 1;
}

function dibujarMensaje() {
  if (!mensaje) return;
  const x = canvas.width / 2;
  const yBase = vertical ? canvas.height * 0.38 : 85;
  const y = yBase - (1 - mensaje.vida) * 30;

  // Si el texto no cabe (por ejemplo en vertical), se achica la letra
  let tamano = 26;
  ctx.font = `${tamano}px "Press Start 2P", monospace`;
  const anchoMaximo = canvas.width - 40;
  const anchoTexto = ctx.measureText(mensaje.texto).width;
  if (anchoTexto > anchoMaximo) {
    tamano = Math.max(12, Math.floor(tamano * anchoMaximo / anchoTexto));
    ctx.font = `${tamano}px "Press Start 2P", monospace`;
  }

  ctx.globalAlpha = mensaje.vida;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = COLORES.contorno;
  ctx.strokeText(mensaje.texto, x, y);
  ctx.fillStyle = mensaje.color;
  ctx.fillText(mensaje.texto, x, y);
  ctx.globalAlpha = 1;
}

/* =====================================================================
   14. Dibujo general (en orden: lo de atrás primero)
   ===================================================================== */
function dibujar() {
  ctx.save();

  // En vertical se gira todo 90°: lo que estaba a la izquierda queda abajo
  if (vertical) {
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
  }

  sacudidaX = sacudida > 0 ? (Math.random() - 0.5) * sacudida : 0;
  sacudidaY = sacudida > 0 ? (Math.random() - 0.5) * sacudida : 0;
  ctx.translate(sacudidaX, sacudidaY);

  ctx.fillStyle = coloresGraderia().base;
  ctx.fillRect(-20, -20, ANCHO_LIENZO + 40, ALTO + 40);

  // Desde aquí, el punto (0, 0) es la esquina de la cancha
  ctx.translate(GRADERIA, 0);

  dibujarGraderia('jugador');
  dibujarGraderia('maquina');

  // Lo de la cancha se recorta para no pintarse encima de las graderías
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ANCHO, ALTO);
  ctx.clip();

  // Piso y líneas de la cancha elegida (ya dibujados una vez; aquí solo se pegan)
  pegarFondo();
  dibujarRastroMojado();

  if (efectoActivo) {
    ctx.fillStyle = colorPoder(efectoActivo.tipo);
    ctx.fillRect(0, 0, ANCHO * (efectoActivo.restante / efectoActivo.duracion), 6);
  }

  dibujarPoder();
  dibujarEscudo();
  dibujarPaleta(jugador, COLORES.jugador, 1);
  dibujarPaleta(maquina, COLORES.maquina, -1);
  dibujarHielo(jugador);
  dibujarHielo(maquina);
  dibujarBalon();
  dibujarPelotasExtra();
  dibujarViento();
  dibujarDron();

  ctx.restore();

  // Fuera del recorte: se ven saliendo de la gradería o entrando por los bordes
  dibujarBotella();
  dibujarAficionado();
  dibujarCelador();
  dibujarAseador();
  dibujarTrapeador();
  dibujarJugadorCruza();

  dibujarParticulas();

  ctx.restore();

  // El mensaje va al final y sin girar, para que siempre se lea derecho
  dibujarMensaje();
  dibujarAyuda2J();
  dibujarRally();
}

// En 2 jugadores: un cartel en cada mitad con el nombre y cómo se juega
function dibujarAyuda2J() {
  if (modo !== 'dos' || ayuda2J <= 0) return;
  const W = canvas.width;
  const H = canvas.height;
  const control1 = ligero ? 'Toca y desliza en tu mitad' : 'Teclas W y S (o el mouse)';
  const control2 = ligero ? 'Toca y desliza en tu mitad' : 'Flechas ↑ y ↓ (o el mouse)';
  const carteles = vertical
    ? [
        { x: W / 2, y: H * 0.72, nombre: nombreJugador, control: control1, color: COLORES.jugador },
        { x: W / 2, y: H * 0.28, nombre: nombreJugador2, control: control2, color: COLORES.maquina }
      ]
    : [
        { x: GRADERIA + ANCHO * 0.25, y: ALTO / 2, nombre: nombreJugador, control: control1, color: COLORES.jugador },
        { x: GRADERIA + ANCHO * 0.75, y: ALTO / 2, nombre: nombreJugador2, control: control2, color: COLORES.maquina }
      ];

  ctx.save();
  ctx.globalAlpha = Math.min(1, ayuda2J / 600); // se desvanece al final
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // En vertical, una línea marca dónde se divide la pantalla
  if (vertical) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  carteles.forEach((c) => {
    const ancho = Math.min(W - 30, 300);
    ctx.fillStyle = 'rgba(22, 11, 58, 0.85)';
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    rectRedondeado(c.x - ancho / 2, c.y - 34, ancho, 68, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.color;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(c.nombre, c.x, c.y - 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(c.control, c.x, c.y + 15);
  });
  ctx.restore();
}

/* =====================================================================
   15. Bucle principal
   ===================================================================== */
function bucle(tiempo) {
  const factor = ultimoTiempo ? limitar((tiempo - ultimoTiempo) / MS_POR_CUADRO, 0, 2) : 1;
  ultimoTiempo = tiempo;

  if (jugando && !pausado) actualizar(factor);
  if (!pausado) actualizarEfectos(factor);
  dibujar();

  requestAnimationFrame(bucle);
}

document.addEventListener('visibilitychange', () => {
  ultimoTiempo = 0; // al volver a la pestaña el juego sigue suave, sin saltos
  // Si cambias de pestaña o de app en pleno juego, se pausa solo
  if (document.hidden && jugando && !pausado) abrirMenu();
});

/* =====================================================================
   16. Inicio y fin del juego
   ===================================================================== */
function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch (error) {
    // Si el navegador no deja guardar, no pasa nada
  }
}

function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch (error) {
    return null;
  }
}

// Muestra u oculta el campo del jugador 2 según el modo elegido
function cambiarModoFormulario() {
  const elegido = formulario.querySelector('input[name="modo"]:checked');
  const dos = elegido && elegido.value === 'dos';
  campoJugador2.hidden = !dos;
  campoNombre2.disabled = !dos; // si está desactivado, no se exige
  etiquetaNombre1.textContent = dos ? 'Usuario jugador 1 (izquierda)' : 'Tu usuario';
}

// Cambia la cancha y vuelve a dibujar su fondo (se ve de una vez detrás de la ventana)
function elegirCancha(nueva) {
  cancha = ['baloncesto', 'futbol', 'hockey'].includes(nueva) ? nueva : 'baloncesto';
  generarFondo();
}

function leerFormulario() {
  modo = formulario.querySelector('input[name="modo"]:checked').value;
  elegirCancha(formulario.querySelector('input[name="cancha"]:checked').value);
  guardar(CLAVE_CANCHA, cancha);
  nivel = NIVELES[formulario.querySelector('input[name="nivel"]:checked').value];

  nombreJugador = campoNombre.value.trim() || 'Jugador';
  guardar(CLAVE_USUARIO, nombreJugador);

  if (modo === 'dos') {
    nombreJugador2 = campoNombre2.value.trim() || 'Jugador 2';
    guardar(CLAVE_USUARIO_2, nombreJugador2);
  }
}

function iniciarJuego() {
  clearTimeout(temporizadorSaque);
  puntosIzquierda = 0;
  puntosDerecha = 0;
  bonoVelocidad = 0;
  yaLeGanaste = false;
  tiempoSinGolpe = 0;
  racha = 0;
  pausado = false;
  menu.hidden = true;
  botonMenu.hidden = false;
  jugador.congelado = false;
  maquina.congelado = false;
  jugador.velTeclado = 0;
  maquina.velTeclado = 0;
  prepararMarcador();
  actualizarMarcador();

  // Tamaño de las paletas según el nivel (Petunia siempre usa la suya)
  jugador.alto = ALTO_PALETA;
  jugador.y = (ALTO - jugador.alto) / 2;
  maquina.alto = ALTO_PALETA;
  maquina.y = (ALTO - maquina.alto) / 2;
  maquina.distraida = false;

  jugador.objetivoY = null;
  maquina.objetivoY = null;
  Object.assign(teclas1, { arriba: false, abajo: false });
  Object.assign(teclas2, { arriba: false, abajo: false });
  punteros.clear();

  particulas = [];
  mensaje = null;
  celebracion = null;
  poder = null;
  efectoActivo = null;
  pelotasExtra = [];
  pelota.radio = RADIO_NORMAL;
  esperaPoder = alAzar(4000, 7000);
  limpiarPeligros();
  esperaPeligro = alAzar(nivel.peligroMin * 0.5, nivel.peligroMin); // el primero sale antes
  esconderFestejo();

  jugando = true;
  if (modo === 'dos') {
    // 2 jugadores: se muestran los controles de cada uno y el saque espera un poquito
    ayuda2J = 3500;
    prepararSaque(Math.random() < 0.5 ? 1 : -1, 1800);
  } else {
    ayuda2J = 0;
    sacarPelota(-1); // contra Petunia el saque va hacia ti
    enSaque = false;
  }

  pantalla.hidden = true;
  document.body.classList.add('en-juego'); // bloquea el desplazamiento de la página
  medirCanvas();
  canvas.focus();
  anunciar(modo === 'dos'
    ? `Empezó el juego: ${nombreJugador} contra ${nombreJugador2}, nivel ${nivel.nombre}. Gana el primero en llegar a ${META}.`
    : `Empezó el juego en nivel ${nivel.nombre}. Gana el primero en llegar a ${META} puntos.`);
}

function mostrarImagenFinal(src, alt, ancho, alto, esFiesta) {
  imagenFinal.src = src;
  imagenFinal.alt = alt;
  imagenFinal.width = ancho;
  imagenFinal.height = alto;
  imagenFinal.classList.toggle('pantalla__imagen--fiesta', esFiesta);
  imagenFinal.hidden = false;
}

function terminarJuego() {
  jugando = false;
  pelotasExtra = [];
  if (efectoActivo) terminarEfecto();
  botonMenu.hidden = true;
  menu.hidden = true;
  pausado = false;
  cerrarRally();
  limpiarPeligros();
  esconderFestejo();

  const ganoIzquierda = puntosIzquierda > puntosDerecha;

  if (modo === 'dos') {
    // Gana el que llegó a 5: sale el gato de fiesta
    const ganador = ganoIzquierda ? nombreJugador : nombreJugador2;
    const perdedor = ganoIzquierda ? nombreJugador2 : nombreJugador;
    const marcador = ganoIzquierda ? `${puntosIzquierda} a ${puntosDerecha}` : `${puntosDerecha} a ${puntosIzquierda}`;

    pantallaTitulo.textContent = `¡${ganador} ganó!`;
    pantallaTexto.textContent = `${ganador} le ganó a ${perdedor} ${marcador} en nivel ${nivel.nombre}. ¿La revancha?`;
    mostrarImagenFinal('img/gato-fiesta.webp', 'Gato de fiesta celebrando', 300, 344, true);
    sonidoFeliz();
    sonidoAplausos(2.5);
    anunciar(`${ganador} ganó ${marcador}.`);
  } else if (puntosIzquierda === puntosDerecha) {
    // Empate: los dos con 5
    pantallaTitulo.textContent = '¡Empate!';
    pantallaTexto.textContent = `${nombreJugador} y ${NOMBRE_MAQUINA} quedaron ${puntosIzquierda} a ${puntosDerecha} en nivel ${nivel.nombre}. ¿Desempatamos?`;
    mostrarImagenFinal('img/gato-fiesta.webp', 'Gato de fiesta celebrando', 300, 344, true);
    sonidoFeliz();
    anunciar(`Empate ${puntosIzquierda} a ${puntosDerecha}.`);
  } else if (ganoIzquierda) {
    // ¡Le ganaste a Petunia!: sale el gato de fiesta
    pantallaTitulo.textContent = `¡${nombreJugador} ganó!`;
    pantallaTexto.textContent = `Le ganaste a ${NOMBRE_MAQUINA} ${puntosIzquierda} a ${puntosDerecha} en nivel ${nivel.nombre}. ¿Te atreves con otro nivel?`;
    mostrarImagenFinal('img/gato-fiesta.webp', 'Gato de fiesta celebrando', 300, 344, true);
    sonidoFeliz();
    sonidoAplausos(2.5);
    anunciar(`¡Ganaste! Le ganaste a ${NOMBRE_MAQUINA} ${puntosIzquierda} a ${puntosDerecha}.`);
  } else {
    // Ganó Petunia: sale el gato riéndose
    const palabra = puntosIzquierda === 1 ? 'punto' : 'puntos';
    pantallaTitulo.textContent = `¡${NOMBRE_MAQUINA} ganó!`;
    pantallaTexto.textContent = `${NOMBRE_MAQUINA} te ganó ${puntosDerecha} a ${puntosIzquierda}. ${nombreJugador}, le hiciste ${puntosIzquierda} ${palabra} en nivel ${nivel.nombre}. Puedes cambiar el usuario, el modo o el nivel y volver a intentarlo.`;
    mostrarImagenFinal('img/gato-risa.webp', 'Gato riéndose y señalándote', 600, 595, false);
    sonidoRisa();
    anunciar(`${NOMBRE_MAQUINA} ganó. ${nombreJugador}, le hiciste ${puntosIzquierda} ${palabra}.`);
  }

  botonJugar.textContent = 'Jugar de nuevo';
  pantalla.classList.add('pantalla--final');
  pantalla.hidden = false;
  document.body.classList.remove('en-juego');
  botonJugar.focus();
}

/* ----- Menú de pausa ----- */
function abrirMenu() {
  if (!jugando) return;
  pausado = true;
  Object.assign(teclas1, { arriba: false, abajo: false });
  Object.assign(teclas2, { arriba: false, abajo: false });
  menu.hidden = false;
  document.body.classList.remove('en-juego'); // dentro del menú sí se puede desplazar
  botonContinuar.focus();
  anunciar('Juego en pausa.');
}

function cerrarMenu() {
  menu.hidden = true;
  pausado = false;
  ultimoTiempo = 0;
  if (jugando) {
    document.body.classList.add('en-juego');
    canvas.focus();
    anunciar('El juego continúa.');
  }
}

// Sale de la partida y vuelve a la ventana de inicio, sin contar resultado
function salirAlInicio() {
  clearTimeout(temporizadorSaque);
  menu.hidden = true;
  pausado = false;
  jugando = false;
  limpiarPeligros();
  pelotasExtra = [];
  poder = null;
  if (efectoActivo) terminarEfecto();
  esconderFestejo();
  racha = 0;
  botonMenu.hidden = true;
  document.body.classList.remove('en-juego');

  pantallaTitulo.textContent = TITULO_INICIO;
  pantallaTexto.textContent = TEXTO_INICIO;
  botonJugar.textContent = 'Comenzar';
  imagenFinal.hidden = true;
  pantalla.classList.remove('pantalla--final');
  pantalla.hidden = false;
  campoNombre.focus();
  anunciar('Saliste al inicio.');
}

/* ----- Rally (solo de la jugada actual) ----- */
function sumarRally() {
  racha++;
  if (racha % 10 === 0) {
    mostrarMensaje(`¡Rally de ${racha}!`, COLORES.borde);
    crearParticulas(pelota.x, pelota.y, COLORES.borde, 16, 4);
  }
}

// Al terminar una jugada, el rally vuelve a cero (no se guarda ningún historial)
function cerrarRally() {
  racha = 0;
}

// Borra los récords que guardaban las versiones anteriores del juego
function borrarHistorialViejo() {
  try {
    localStorage.removeItem('petupong-records');
  } catch (error) {
    // Si el navegador no deja, no pasa nada
  }
}

// Contador de rally en la esquina de la cancha (sin girar, siempre derecho)
function dibujarRally() {
  if (!jugando || racha < 3) return;
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = COLORES.contorno;
  const texto = `Rally ${racha}`;
  const x = canvas.width - 12;
  const y = vertical ? GRADERIA + 10 : 10;
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(texto, x, y);
  ctx.restore();
}

/* =====================================================================
   17. Controles
   ===================================================================== */
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault(); // no recarga la página
  prepararAudio();         // el clic permite que suene el audio
  leerFormulario();
  iniciarJuego();
});

formulario.querySelectorAll('input[name="modo"]').forEach((opcion) => {
  opcion.addEventListener('change', cambiarModoFormulario);
});

// Al tocar una cancha, se ve de una vez detrás de la ventana
formulario.querySelectorAll('input[name="cancha"]').forEach((opcion) => {
  opcion.addEventListener('change', () => elegirCancha(opcion.value));
});

botonSonido.addEventListener('click', cambiarSonido);
botonMenu.addEventListener('click', abrirMenu);
botonContinuar.addEventListener('click', cerrarMenu);
botonReiniciar.addEventListener('click', () => {
  menu.hidden = true;
  pausado = false;
  iniciarJuego();
});
botonSalir.addEventListener('click', salirAlInicio);

// Qué tecla mueve qué paleta.
// Contra Petunia: W/S y flechas mueven tu paleta.
// En 2 jugadores: W/S = jugador 1 (izquierda), flechas = jugador 2 (derecha).
// (A/D y las flechas ← → hacen lo mismo que W/S y ↑ ↓; sirven con la cancha vertical)
function teclaDe(tecla) {
  const t = tecla.length === 1 ? tecla.toLowerCase() : tecla;
  const esArriba1 = t === 'w' || t === 'a';
  const esAbajo1 = t === 's' || t === 'd';
  const esArriba2 = t === 'ArrowUp' || t === 'ArrowLeft';
  const esAbajo2 = t === 'ArrowDown' || t === 'ArrowRight';

  if (modo === 'dos') {
    if (esArriba1) return [teclas1, 'arriba'];
    if (esAbajo1) return [teclas1, 'abajo'];
    if (esArriba2) return [teclas2, 'arriba'];
    if (esAbajo2) return [teclas2, 'abajo'];
    return null;
  }

  if (esArriba1 || esArriba2) return [teclas1, 'arriba'];
  if (esAbajo1 || esAbajo2) return [teclas1, 'abajo'];
  return null;
}

document.addEventListener('keydown', (evento) => {
  if (evento.target.matches('input')) return; // si está escribiendo el usuario, no mover nada

  // Esc o P: abrir o cerrar el menú de pausa
  if (jugando && (evento.key === 'Escape' || evento.key === 'p' || evento.key === 'P')) {
    evento.preventDefault();
    if (pausado) cerrarMenu();
    else abrirMenu();
    return;
  }
  const accion = teclaDe(evento.key);
  if (!accion) return;
  accion[0][accion[1]] = true;
  if (jugando && evento.key.startsWith('Arrow')) evento.preventDefault();
});

document.addEventListener('keyup', (evento) => {
  const accion = teclaDe(evento.key);
  if (accion) accion[0][accion[1]] = false;
});

// Mouse y dedo. En 2 jugadores, la mitad izquierda de la cancha mueve al jugador 1
// y la mitad derecha al jugador 2 (cada dedo se queda con la paleta que tocó primero)
function paletaSegunLado(evento) {
  if (modo !== 'dos') return jugador;
  const caja = canvas.getBoundingClientRect();
  if (vertical) {
    // Vertical: la mitad de abajo es del jugador 1 y la de arriba del jugador 2
    return evento.clientY - caja.top > caja.height / 2 ? jugador : maquina;
  }
  return evento.clientX - caja.left < caja.width / 2 ? jugador : maquina;
}

// La posición del canvas se guarda y solo se vuelve a medir cuando hace falta
// (medirla en cada movimiento del dedo hace que el celular se trabe)
let cajaCanvas = null;
function medirCanvas() {
  cajaCanvas = canvas.getBoundingClientRect();
}
window.addEventListener('resize', medirCanvas);
window.addEventListener('scroll', medirCanvas, { passive: true });

function moverConPuntero(evento, paleta) {
  if (!jugando) return;
  if (!cajaCanvas) medirCanvas();
  const caja = cajaCanvas;
  // Con el dedo la canasta sigue más rápido que con el mouse, para que se sienta fluida
  paleta.suavidad = evento.pointerType === 'touch' ? 0.5 : SUAVIDAD_PUNTERO;
  // Acostada: la canasta sigue al dedo de arriba a abajo.
  // Vertical: la canasta sigue al dedo de lado a lado.
  const y = vertical
    ? (evento.clientX - caja.left) * (ALTO / caja.width)
    : (evento.clientY - caja.top) * (ALTO / caja.height);
  paleta.objetivoY = limitar(y - paleta.alto / 2, 0, ALTO - paleta.alto);
}

canvas.addEventListener('pointerdown', (evento) => {
  medirCanvas();
  canvas.setPointerCapture(evento.pointerId);
  const paleta = paletaSegunLado(evento);
  punteros.set(evento.pointerId, paleta);
  moverConPuntero(evento, paleta);
});

canvas.addEventListener('pointermove', (evento) => {
  // Si el dedo ya eligió paleta, sigue con esa; si es el mouse sin presionar, según el lado
  const paleta = punteros.get(evento.pointerId) || paletaSegunLado(evento);
  moverConPuntero(evento, paleta);
});

['pointerup', 'pointercancel', 'lostpointercapture'].forEach((tipo) => {
  canvas.addEventListener(tipo, (evento) => punteros.delete(evento.pointerId));
});

/* =====================================================================
   18. Arranque
   ===================================================================== */
const guardado1 = leer(CLAVE_USUARIO);
const guardado2 = leer(CLAVE_USUARIO_2);
if (guardado1) campoNombre.value = guardado1;
if (guardado2) campoNombre2.value = guardado2;

aplicarOrientacion();
consultaVertical.addEventListener('change', aplicarOrientacion);

// Pantalla completa: solo aparece si el navegador lo permite
if (document.fullscreenEnabled) {
  botonPantalla.hidden = false;
  botonPantalla.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const activa = Boolean(document.fullscreenElement);
    botonPantalla.textContent = activa ? '⤡ Salir' : '⤢ Pantalla completa';
    botonPantalla.setAttribute('aria-pressed', String(activa));
  });
}

// Recordar la última cancha elegida
const canchaGuardada = leer(CLAVE_CANCHA);
if (canchaGuardada) {
  const opcionCancha = formulario.querySelector(`input[name="cancha"][value="${canchaGuardada}"]`);
  if (opcionCancha) opcionCancha.checked = true;
}
elegirCancha(formulario.querySelector('input[name="cancha"]:checked').value);

borrarHistorialViejo();
cambiarModoFormulario();
crearPublico();
separarPublico();
actualizarMarcador();
requestAnimationFrame(bucle);
