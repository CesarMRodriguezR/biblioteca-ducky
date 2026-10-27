'use strict';

const { z } = require('zod');

// Mensajes por defecto en español (locales de zod 4).
z.config(z.locales.es());

const id = z.coerce.number().int().positive();
const textoOpcional = (max) => z.string().trim().max(max).optional().nullable();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');
const booleano = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

/** Convierte números (p. ej. celdas de Excel) a texto sin volver texto a null/undefined. */
const aTexto = (v) => (typeof v === 'number' ? String(v) : v);
const texto = (max) => z.preprocess(aTexto, z.string().trim().max(max));
const obligatorio = 'Este campo es obligatorio.';
const requerido = (max) => z.preprocess(aTexto, z.string({ error: obligatorio }).trim().min(1, obligatorio).max(max));
const contrasenaSegura = z.string()
  .min(8, 'Mínimo 8 caracteres, una mayúscula y un número.')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'Mínimo 8 caracteres, una mayúscula y un número.')
  .regex(/\d/, 'Mínimo 8 caracteres, una mayúscula y un número.');
const isbn = z.string({ error: obligatorio }).trim()
  .min(1, obligatorio)
  .regex(/^[0-9-]+$/, 'Formato inválido: solo números y guiones.')
  .refine((v) => { const d = v.replace(/-/g, '').length; return d === 10 || d === 13; },
    'El ISBN debe tener 10 o 13 dígitos.');
const anioCuatroDigitos = z.coerce.number({ error: 'Debe ser un número de 4 dígitos, p. ej. 2022.' })
  .int('Debe ser un número de 4 dígitos, p. ej. 2022.')
  .min(1000, 'Debe ser un número de 4 dígitos, p. ej. 2022.')
  .max(9999, 'Debe ser un número de 4 dígitos, p. ej. 2022.');
const numeroCopias = z.coerce.number({ error: 'Debe ser 1 o más; no se aceptan cero ni negativos.' })
  .int('Debe ser un número entero.')
  .min(1, 'Debe ser 1 o más; no se aceptan cero ni negativos.')
  .max(500);
const textoLista = (max) => texto(max).nullish().transform((v) => v ?? '');
const filaLista = z.object({
  Fila: z.coerce.number().int().optional(),
  Nombre_Usuario: textoLista(60),
  Matricula_Nomina: textoLista(20),
  Nombre_Completo: textoLista(150),
  Correo: textoLista(150),
  id_perfil: id.optional().nullable(),
});

const paginacion = {
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};

const esquemas = {
  idParam: z.object({ id }),

  paginacion: z.object(paginacion),

  // Autenticación -------------------------------------------------------
  login: z.object({
    Nombre_Usuario: z.string().trim().min(1, obligatorio).max(60),
    Contrasena_Usuario: z.string().min(1, obligatorio),
  }),

  cambiarContrasena: z.object({
    actual: z.string().min(1, obligatorio),
    nueva: contrasenaSegura,
  }),

  // Usuarios y perfiles -------------------------------------------------
  usuarioCrear: z.object({
    Nombre_Usuario: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,60}$/, 'Usa letras, números y puntos.'),
    Nombre_Completo: requerido(150),
    Correo: z.string().trim().email('Correo inválido.').optional().nullable(),
    Contrasena_Usuario: contrasenaSegura,
    Matricula_Nomina: z.preprocess(aTexto, z.string({ error: obligatorio }).trim()).pipe(z.string().regex(/^\d{1,10}$/, 'Formato inválido: solo se permiten números.')),
    id_perfil: id,
    Estatus: z.enum(['Activo', 'Inactivo', 'Bloqueado']).optional(),
  }),

  usuarioActualizar: z.object({
    Nombre_Completo: requerido(150).optional(),
    Correo: z.string().trim().email('Correo inválido.').optional().nullable(),
    Contrasena_Usuario: z.union([contrasenaSegura, z.literal('')]).optional()
      .transform((v) => v || undefined),
    id_perfil: id.optional(),
    Estatus: z.enum(['Activo', 'Inactivo', 'Bloqueado']).optional(),
    Matricula_Nomina: z.any().optional(),
    Nombre_Usuario: z.any().optional(),
  }).superRefine((datos, ctx) => {
    ['Matricula_Nomina', 'Nombre_Usuario'].forEach((campo) => {
      if (datos[campo] !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message: 'Este dato no se puede modificar.' });
      }
    });
  }),

  usuarioFiltros: z.object({
    ...paginacion,
    id_perfil: id.optional(),
    estatus: z.enum(['Activo', 'Inactivo', 'Bloqueado']).optional(),
  }),

  cargaValidar: z.object({ filas: z.array(filaLista).min(1, 'La lista está vacía.').max(5000) }),

  cargaConfirmar: z.object({ cuentas: z.array(filaLista).min(1, 'La lista está vacía.').max(5000) }),

  bajasRevisar: z.object({ matriculas: z.array(z.preprocess(aTexto, z.string().trim())).min(1, 'La lista está vacía.') }),

  bajasConfirmar: z.object({ ids: z.array(id).min(1, 'Selecciona al menos un usuario.') }),

  perfil: z.object({
    Nombre_Rol: z.string().trim().min(1).max(50),
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
    Descripcion_Perfil: textoOpcional(255),
  }),

  perfilFunciones: z.object({ funciones: z.array(id) }),

  funcion: z.object({
    Nombre_Funcion: z.string().trim().min(1).max(80),
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
    Descripcion_Funcion: textoOpcional(255),
  }),

  // Catálogo ------------------------------------------------------------
  editorial: z.object({
    Nombre_Editorial: requerido(120),
    Pais: requerido(60),
  }),

  autor: z.object({
    Nombre: z.string().trim().min(1).max(60),
    Segundo_Nombre: textoOpcional(60),
    Apellido_Paterno: z.string().trim().min(1).max(60),
    Apellido_Materno: textoOpcional(60),
  }),

  tema: z.object({
    Nombre_Tema: z.string().trim().min(1).max(80),
    Descripcion: textoOpcional(255),
  }),

  libroBusqueda: z.object({
    ...paginacion,
    limit: z.coerce.number().int().min(1).max(200).default(6),
    campo: z.enum(['todos', 'titulo', 'autor', 'editorial', 'isbn', 'anio', 'tema']).default('todos'),
    orden: z.enum(['titulo', 'autor', 'anio_desc', 'anio_asc', 'disponibles']).default('titulo'),
    desde: z.coerce.number().int().min(0).max(9999).optional(),
    hasta: z.coerce.number().int().min(0).max(9999).optional(),
    tema: id.optional(),
    editorial: id.optional(),
    disponibles: booleano.optional(),
    inactivos: booleano.optional(),
  }),

  libroCrear: z.object({
    ISBN: isbn,
    Titulo: requerido(200),
    Autor: requerido(300),
    id_editorial: z.coerce.number({ error: obligatorio }).int().positive(obligatorio),
    Anio: anioCuatroDigitos,
    Tema: requerido(200),
    Sinopsis: requerido(5000),
    Precio: z.coerce.number({ error: 'Debe ser un precio mayor a $0.00 en pesos mexicanos.' })
      .positive('Debe ser un precio mayor a $0.00 en pesos mexicanos; no se aceptan cero ni negativos.'),
  }),

  libroActualizar: z.object({
    ISBN: z.string().trim().optional(),
    Titulo: requerido(200).optional(),
    Autor: requerido(300).optional(),
    id_editorial: id.optional(),
    Anio: anioCuatroDigitos.optional(),
    Tema: requerido(200).optional(),
    Sinopsis: requerido(5000).optional(),
    Precio: z.coerce.number().positive('Debe ser un precio mayor a $0.00.').optional(),
    Numero_Copias: z.coerce.number({ error: 'Debe ser 1 o más; no se aceptan números negativos ni cero.' })
      .int().min(1, 'Debe ser 1 o más; no se aceptan números negativos ni cero.').optional(),
  }),

  libroEstatus: z.object({ Estatus: z.enum(['Activo', 'Inactivo']) }),

  isbnParam: z.object({ isbn: z.string().trim().min(1) }),

  ejemplaresAgregar: z.object({
    cantidad: numeroCopias.default(1),
    Pasillo: textoOpcional(10),
    Estante: textoOpcional(30),
    Nivel: textoOpcional(10),
    Estatus: z.enum(['Disponible', 'Consulta externa']).optional(),
  }),

  ejemplarParams: z.object({ id, numCopia: id }),

  ejemplarActualizar: z.object({
    Estatus: z.enum(['Disponible', 'Consulta externa'], {
      error: '«En préstamo» lo asigna el sistema; elige Disponible o Consulta externa.',
    }).optional(),
    Pasillo: textoOpcional(10),
    Estante: textoOpcional(30),
    Nivel: textoOpcional(10),
  }),

  ejemplarBaja: z.object({
    Motivo_Baja: z.enum(['Perdido', 'Robado', 'Danado', 'Obsoleto'], {
      error: 'Elige el motivo de la baja.',
    }),
  }),

  // Circulación ---------------------------------------------------------
  prestamoCrear: z.object({
    id_libro: id,
    num_copia: id.optional(),
    id_usuario: id.optional(),
  }),

  prestamoFiltros: z.object({
    ...paginacion,
    id_usuario: id.optional(),
    estado: z.enum(['Activo', 'Devuelto', 'Vencido']).optional(),
  }),

  devolucion: z.object({ Fecha_Devolucion: fecha.optional() }),

  multaCrear: z.object({
    id_usuario: id,
    id_prestamo: id.optional().nullable(),
    Cantidad_a_Pagar: z.coerce.number().positive(),
    Justificacion: z.string().trim().min(1).max(255),
  }),

  multaFiltros: z.object({
    ...paginacion,
    id_usuario: id.optional(),
    pendientes: booleano.optional(),
  }),

  multaPago: z.object({ Fecha_Pagado: fecha.optional() }),

  listaEsperaCrear: z.object({ id_libro: id }),

  listaEsperaFiltros: z.object({
    ...paginacion,
    id_usuario: id.optional(),
    id_libro: id.optional(),
    estatus: z.enum(['En espera', 'Notificado', 'Atendido', 'Cancelado']).optional(),
  }),

  // Adquisiciones -------------------------------------------------------
  nuevoLibro: z.object({
    ISBN: isbn,
    Titulo: requerido(200),
    Autor: textoOpcional(150),
    Editorial: textoOpcional(120),
    Precio: z.coerce.number().min(0).default(0),
    Anio: anioCuatroDigitos.optional().nullable(),
    Tema: textoOpcional(80),
    Sinopsis: z.string().trim().optional().nullable(),
  }),

  ordenCrear: z.object({
    librosNuevos: z.array(z.object({
      id_libro_nuevo: id.optional(),
      nuevo: z.object({
        ISBN: isbn,
        Titulo: requerido(200),
        Autor: requerido(150),
        id_editorial: id.optional(),
        Editorial: textoOpcional(120),
        Anio: anioCuatroDigitos,
        Tema: requerido(80),
        Sinopsis: requerido(5000),
        Precio: z.coerce.number().min(0).default(0),
      }).optional(),
      Num_Ejemplares: numeroCopias,
      Justificacion: textoOpcional(255),
    }).refine((x) => x.id_libro_nuevo || x.nuevo, 'Indica id_libro_nuevo o los datos del libro')).default([]),
    librosExistentes: z.array(z.object({
      id_libro: id,
      Num_Ejemplares: z.coerce.number({ error: 'Debe ser 1 o más; no se acepta vacío ni cero.' })
        .int().min(1, 'Debe ser 1 o más; no se acepta vacío ni cero.'),
      Justificacion: textoOpcional(255),
    })).default([]),
  }),

  ordenFiltros: z.object({
    ...paginacion,
    estatus: z.enum(['Pendiente', 'En revision', 'Aprobada', 'Rechazada', 'Recibida']).optional(),
  }),

  ordenEstatus: z.object({
    Estatus: z.enum(['En revision', 'Aprobada', 'Rechazada', 'Recibida']),
  }),

  // Políticas y chatbot -------------------------------------------------
  politica: z.object({ Informacion: z.string().trim().min(1) }),

  chatbotPreguntar: z.object({ texto: z.string().trim().min(2).max(255) }),

  chatbotPreguntaCrear: z.object({
    Pregunta: z.string().trim().min(3).max(255),
    Respuesta: z.string().trim().min(1),
    id_fuentes: id,
  }),

  chatbotPreguntaActualizar: z.object({
    Pregunta: z.string().trim().min(3).max(255).optional(),
    Respuesta: z.string().trim().min(1).optional(),
    id_fuentes: id.optional(),
  }),

  fuente: z.object({ Fuente: z.string().trim().min(1).max(255) }),
};

module.exports = esquemas;
