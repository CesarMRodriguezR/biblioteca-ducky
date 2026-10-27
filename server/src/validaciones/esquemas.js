import { z } from 'zod';

// Mensajes por defecto en español (locales de zod 4).
z.config(z.locales.es());

const id = z.coerce.number().int().positive();
const TextoOpcional = (max) => z.string().trim().max(max).optional().nullable();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');
const booleano = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((valor) => valor === true || valor === 'true' || valor === '1');

/** Convierte números (p. ej. celdas de Excel) a texto sin volver texto a null/undefined. */
const ConvertirATexto = (valor) => (typeof valor === 'number' ? String(valor) : valor);
const Texto = (max) => z.preprocess(ConvertirATexto, z.string().trim().max(max));
const obligatorio = 'Este campo es obligatorio.';
const Requerido = (max) =>
  z.preprocess(
    ConvertirATexto,
    z.string({ error: obligatorio }).trim().min(1, obligatorio).max(max),
  );
const contrasena_segura = z
  .string()
  .min(8, 'Mínimo 8 caracteres, una mayúscula y un número.')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'Mínimo 8 caracteres, una mayúscula y un número.')
  .regex(/\d/, 'Mínimo 8 caracteres, una mayúscula y un número.');
const isbn = z
  .string({ error: obligatorio })
  .trim()
  .min(1, obligatorio)
  .regex(/^[0-9-]+$/, 'Formato inválido: solo números y guiones.')
  .refine((valor) => 
  {
    const dia = valor.replace(/-/g, '').length;
    return dia === 10 || dia === 13;
  }, 'El ISBN debe tener 10 o 13 dígitos.');
const anio_cuatro_digitos = z.coerce
  .number({ error: 'Debe ser un número de 4 dígitos, p. ej. 2022.' })
  .int('Debe ser un número de 4 dígitos, p. ej. 2022.')
  .min(1000, 'Debe ser un número de 4 dígitos, p. ej. 2022.')
  .max(9999, 'Debe ser un número de 4 dígitos, p. ej. 2022.');
const numero_copias = z.coerce
  .number({ error: 'Debe ser 1 o más; no se aceptan cero ni negativos.' })
  .int('Debe ser un número entero.')
  .min(1, 'Debe ser 1 o más; no se aceptan cero ni negativos.')
  .max(500);
const TextoLista = (max) =>
  Texto(max)
    .nullish()
    .transform((valor) => valor ?? '');
const fila_lista = z.object({
  Fila: z.coerce.number().int().optional(),
  Nombre_Usuario: TextoLista(60),
  Matricula_Nomina: TextoLista(20),
  Nombre_Completo: TextoLista(150),
  Correo: TextoLista(150),
  id_perfil: id.optional().nullable(),
});

const paginacion = {
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};

const esquemas = {
  id_param: z.object({ id }),

  paginacion: z.object(paginacion),

  // Autenticación -------------------------------------------------------
  login: z.object({
    Nombre_Usuario: z.string().trim().min(1, obligatorio).max(60),
    Contrasena_Usuario: z.string().min(1, obligatorio),
  }),

  cambiar_contrasena: z.object({
    actual: z.string().min(1, obligatorio),
    nueva: contrasena_segura,
  }),

  // Usuarios y perfiles -------------------------------------------------
  usuario_crear: z.object({
    Nombre_Usuario: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,60}$/, 'Usa letras, números y puntos.'),
    Nombre_Completo: Requerido(150),
    Correo: z.string().trim().email('Correo inválido.').optional().nullable(),
    Contrasena_Usuario: contrasena_segura,
    Matricula_Nomina: z
      .preprocess(ConvertirATexto, z.string({ error: obligatorio }).trim())
      .pipe(z.string().regex(/^\d{1,10}$/, 'Formato inválido: solo se permiten números.')),
    id_perfil: id,
    Estatus: z.enum(['Activo', 'Inactivo', 'Bloqueado']).optional(),
  }),

  usuario_actualizar: z
    .object({
      Nombre_Completo: Requerido(150).optional(),
      Correo: z.string().trim().email('Correo inválido.').optional().nullable(),
      Contrasena_Usuario: z
        .union([contrasena_segura, z.literal('')])
        .optional()
        .transform((valor) => valor || undefined),
      id_perfil: id.optional(),
      Estatus: z.enum(['Activo', 'Inactivo', 'Bloqueado']).optional(),
      Matricula_Nomina: z.any().optional(),
      Nombre_Usuario: z.any().optional(),
    })
    .superRefine((datos, ctx) => 
    {
      ['Matricula_Nomina', 'Nombre_Usuario'].forEach((campo) => 
      {
        if (datos[campo] !== undefined) 
        {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [campo],
            message: 'Este dato no se puede modificar.',
          });
        }
      });
    }),

  usuario_filtros: z.object({
    ...paginacion,
    id_perfil: id.optional(),
    estatus: z.enum(['Activo', 'Inactivo', 'Bloqueado']).optional(),
  }),

  carga_validar: z.object({ filas: z.array(fila_lista).min(1, 'La lista está vacía.').max(5000) }),

  carga_confirmar: z.object({
    cuentas: z.array(fila_lista).min(1, 'La lista está vacía.').max(5000),
  }),

  bajas_revisar: z.object({
    matriculas: z
      .array(z.preprocess(ConvertirATexto, z.string().trim()))
      .min(1, 'La lista está vacía.'),
  }),

  bajas_confirmar: z.object({ ids: z.array(id).min(1, 'Selecciona al menos un usuario.') }),

  perfil: z.object({
    Nombre_Rol: z.string().trim().min(1).max(50),
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
    Descripcion_Perfil: TextoOpcional(255),
  }),

  perfil_funciones: z.object({ funciones: z.array(id) }),

  funcion: z.object({
    Nombre_Funcion: z.string().trim().min(1).max(80),
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
    Descripcion_Funcion: TextoOpcional(255),
  }),

  // Catálogo ------------------------------------------------------------
  editorial: z.object({
    Nombre_Editorial: Requerido(120),
    Pais: Requerido(60),
  }),

  autor: z.object({
    Nombre: z.string().trim().min(1).max(60),
    Segundo_Nombre: TextoOpcional(60),
    Apellido_Paterno: z.string().trim().min(1).max(60),
    Apellido_Materno: TextoOpcional(60),
  }),

  tema: z.object({
    Nombre_Tema: z.string().trim().min(1).max(80),
    Descripcion: TextoOpcional(255),
  }),

  libro_busqueda: z.object({
    ...paginacion,
    limit: z.coerce.number().int().min(1).max(200).default(6),
    campo: z
      .enum(['todos', 'titulo', 'autor', 'editorial', 'isbn', 'anio', 'tema'])
      .default('todos'),
    orden: z.enum(['titulo', 'autor', 'anio_desc', 'anio_asc', 'disponibles']).default('titulo'),
    desde: z.coerce.number().int().min(0).max(9999).optional(),
    hasta: z.coerce.number().int().min(0).max(9999).optional(),
    tema: id.optional(),
    editorial: id.optional(),
    disponibles: booleano.optional(),
    inactivos: booleano.optional(),
  }),

  libro_crear: z.object({
    ISBN: isbn,
    Titulo: Requerido(200),
    Autor: Requerido(300),
    id_editorial: z.coerce.number({ error: obligatorio }).int().positive(obligatorio),
    Anio: anio_cuatro_digitos,
    Tema: Requerido(200),
    Sinopsis: Requerido(5000),
    Precio: z.coerce
      .number({ error: 'Debe ser un precio mayor a $0.00 en pesos mexicanos.' })
      .positive(
        'Debe ser un precio mayor a $0.00 en pesos mexicanos; no se aceptan cero ni negativos.',
      ),
  }),

  libro_actualizar: z.object({
    ISBN: z.string().trim().optional(),
    Titulo: Requerido(200).optional(),
    Autor: Requerido(300).optional(),
    id_editorial: id.optional(),
    Anio: anio_cuatro_digitos.optional(),
    Tema: Requerido(200).optional(),
    Sinopsis: Requerido(5000).optional(),
    Precio: z.coerce.number().positive('Debe ser un precio mayor a $0.00.').optional(),
    Numero_Copias: z.coerce
      .number({ error: 'Debe ser 1 o más; no se aceptan números negativos ni cero.' })
      .int()
      .min(1, 'Debe ser 1 o más; no se aceptan números negativos ni cero.')
      .optional(),
  }),

  libro_estatus: z.object({ Estatus: z.enum(['Activo', 'Inactivo']) }),

  isbn_param: z.object({ isbn: z.string().trim().min(1) }),

  ejemplares_agregar: z.object({
    cantidad: numero_copias.default(1),
    Pasillo: TextoOpcional(10),
    Estante: TextoOpcional(30),
    Nivel: TextoOpcional(10),
    Estatus: z.enum(['Disponible', 'Consulta externa']).optional(),
  }),

  ejemplar_params: z.object({ id, num_copia: id }),

  ejemplar_actualizar: z.object({
    Estatus: z
      .enum(['Disponible', 'Consulta externa'], {
        error: '«En préstamo» lo asigna el sistema; elige Disponible o Consulta externa.',
      })
      .optional(),
    Pasillo: TextoOpcional(10),
    Estante: TextoOpcional(30),
    Nivel: TextoOpcional(10),
  }),

  ejemplar_baja: z.object({
    Motivo_Baja: z.enum(['Perdido', 'Robado', 'Danado', 'Obsoleto'], {
      error: 'Elige el motivo de la baja.',
    }),
  }),

  // Circulación ---------------------------------------------------------
  prestamo_crear: z.object({
    id_libro: id,
    num_copia: id.optional(),
    id_usuario: id.optional(),
  }),

  prestamo_filtros: z.object({
    ...paginacion,
    id_usuario: id.optional(),
    estado: z.enum(['Activo', 'Devuelto', 'Vencido']).optional(),
  }),

  devolucion: z.object({ Fecha_Devolucion: fecha.optional() }),

  multa_crear: z.object({
    id_usuario: id,
    id_prestamo: id.optional().nullable(),
    Cantidad_a_Pagar: z.coerce.number().positive(),
    Justificacion: z.string().trim().min(1).max(255),
  }),

  multa_filtros: z.object({
    ...paginacion,
    id_usuario: id.optional(),
    pendientes: booleano.optional(),
  }),

  multa_pago: z.object({ Fecha_Pagado: fecha.optional() }),

  lista_espera_crear: z.object({ id_libro: id }),

  lista_espera_filtros: z.object({
    ...paginacion,
    id_usuario: id.optional(),
    id_libro: id.optional(),
    estatus: z.enum(['En espera', 'Notificado', 'Atendido', 'Cancelado']).optional(),
  }),

  // Adquisiciones -------------------------------------------------------
  nuevo_libro: z.object({
    ISBN: isbn,
    Titulo: Requerido(200),
    Autor: TextoOpcional(150),
    Editorial: TextoOpcional(120),
    Precio: z.coerce.number().min(0).default(0),
    Anio: anio_cuatro_digitos.optional().nullable(),
    Tema: TextoOpcional(80),
    Sinopsis: z.string().trim().optional().nullable(),
  }),

  orden_crear: z.object({
    libros_nuevos: z
      .array(
        z
          .object({
            id_libro_nuevo: id.optional(),
            nuevo: z
              .object({
                ISBN: isbn,
                Titulo: Requerido(200),
                Autor: Requerido(150),
                id_editorial: id.optional(),
                Editorial: TextoOpcional(120),
                Anio: anio_cuatro_digitos,
                Tema: Requerido(80),
                Sinopsis: Requerido(5000),
                Precio: z.coerce.number().min(0).default(0),
              })
              .optional(),
            Num_Ejemplares: numero_copias,
            Justificacion: TextoOpcional(255),
          })
          .refine(
            (posicion_x) => posicion_x.id_libro_nuevo || posicion_x.nuevo,
            'Indica id_libro_nuevo o los datos del libro',
          ),
      )
      .default([]),
    libros_existentes: z
      .array(
        z.object({
          id_libro: id,
          Num_Ejemplares: z.coerce
            .number({ error: 'Debe ser 1 o más; no se acepta vacío ni cero.' })
            .int()
            .min(1, 'Debe ser 1 o más; no se acepta vacío ni cero.'),
          Justificacion: TextoOpcional(255),
        }),
      )
      .default([]),
  }),

  orden_filtros: z.object({
    ...paginacion,
    estatus: z.enum(['Pendiente', 'En revision', 'Aprobada', 'Rechazada', 'Recibida']).optional(),
  }),

  orden_estatus: z.object({
    Estatus: z.enum(['En revision', 'Aprobada', 'Rechazada', 'Recibida']),
  }),

  // Políticas y chatbot -------------------------------------------------
  politica: z.object({ Informacion: z.string().trim().min(1) }),

  chatbot_preguntar: z.object({ texto: z.string().trim().min(2).max(255) }),

  chatbot_pregunta_crear: z.object({
    Pregunta: z.string().trim().min(3).max(255),
    Respuesta: z.string().trim().min(1),
    id_fuentes: id,
  }),

  chatbot_pregunta_actualizar: z.object({
    Pregunta: z.string().trim().min(3).max(255).optional(),
    Respuesta: z.string().trim().min(1).optional(),
    id_fuentes: id.optional(),
  }),

  fuente: z.object({ Fuente: z.string().trim().min(1).max(255) }),
};

export { esquemas };
