/*
 * ******************************************************************
 * Nombre del programa: API-ESQUEMAS · esquemas.js
 * Función: Esquemas zod de validación de cada petición, con los mensajes del prototipo.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Cuerpo, consulta o parámetros de la petición
 * Salida: Datos convertidos o lista de errores por campo
 * Nomenclatura: Variables en snake_case, funciones en CamelCase,
 *               constantes en SNAKE_CASE (mayúsculas completas),
 *               clases y módulos en CamelCase.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Módulo            Objetivo
 *     TextoOpcional     Esquema de texto opcional con longitud máxima
 *     ComponenteUbicacion  Esquema de un componente de la ubicación (sin «-»)
 *     id                Identificador VARCHAR(13) como texto numérico
 *     num_copia         Número de copia de un ejemplar
 *     ConvertirATexto   Convierte números (p. ej. una matrícula numérica) a texto…
 *     Requerido         Esquema de texto obligatorio con el mensaje «Este campo…
 *     esquemas          Esquemas de validación de cada ruta de la API
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Se aplican con Validar(esquema, origen) en rutas/rutas.js; los mensajes están en español.
 * ******************************************************************
 */

import { z } from 'zod';

// Mensajes por defecto en español (locales de zod 4).
z.config(z.locales.es());

/*
 * Constante: id
 * Objetivo: Identificador de un registro: VARCHAR(13) como en el diccionario de datos. Se guarda
 *           como texto numérico; acepta número o texto y siempre entrega texto.
 */
const id = z.preprocess(
  (valor) => (typeof valor === 'number' ? String(valor) : valor),
  z.string().trim().regex(/^\d{1,13}$/, 'Identificador inválido.'),
);
/*
 * Constante: num_copia
 * Objetivo: Número de copia de un ejemplar (INT en el diccionario).
 */
const num_copia = z.coerce.number().int().positive();
/*
 * Función: TextoOpcional
 * Objetivo: Esquema de texto opcional con longitud máxima.
 * Entrada: maximo
 * Salida: Esquema zod
 */
const TextoOpcional = (maximo) => z.string().trim().max(maximo).optional().nullable();

/*
 * Función: ComponenteUbicacion
 * Objetivo: Esquema de un componente de la ubicación (pasillo, estante, nivel o sección): texto
 *           opcional sin «-», que es el separador del código de ubicación.
 * Entrada: maximo
 * Salida: Esquema zod
 */
const ComponenteUbicacion = (maximo) =>
  z
    .string()
    .trim()
    .max(maximo)
    .regex(/^[^-]*$/, 'No puede llevar el carácter «-».')
    .optional()
    .nullable();
const booleano = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((valor) => valor === true || valor === 'true' || valor === '1');

/*
 * Función: ConvertirATexto
 * Objetivo: Convierte números (p. ej. una matrícula numérica) a texto sin volver texto a
 *           null/undefined.
 * Entrada: valor
 * Salida: Texto o el valor original
 */
const ConvertirATexto = (valor) => (typeof valor === 'number' ? String(valor) : valor);
const obligatorio = 'Este campo es obligatorio.';
/*
 * Función: Requerido
 * Objetivo: Esquema de texto obligatorio con el mensaje «Este campo es obligatorio.».
 * Entrada: maximo
 * Salida: Esquema zod
 */
const Requerido = (maximo) =>
  z.preprocess(
    ConvertirATexto,
    z.string({ error: obligatorio }).trim().min(1, obligatorio).max(maximo),
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
const paginacion = {
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};

/*
 * Módulo: esquemas
 * Objetivo: Esquemas de validación de cada ruta de la API.
 */
const esquemas = {
  id_param: z.object({ id }),

  paginacion: z.object(paginacion),

  // Autenticación -------------------------------------------------------
  login: z.object({
    Nombre_Usuario: z.string().trim().min(1, obligatorio).max(150),
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
      .regex(/^[a-z0-9._-]{3,150}$/, 'Usa letras, números y puntos.'),
    Nombre_Completo: Requerido(150),
    Correo: z.string().trim().email('Correo inválido.').optional().nullable(),
    Contrasena_Usuario: contrasena_segura,
    Matricula_Nomina: z
      .preprocess(ConvertirATexto, z.string({ error: obligatorio }).trim())
      .pipe(z.string().regex(/^\d{1,13}$/, 'Formato inválido: solo se permiten números.')),
    id_perfil: id,
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
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
      Estatus: z.enum(['Activo', 'Inactivo']).optional(),
      Matricula_Nomina: z.any().optional(),
      Nombre_Usuario: z.any().optional(),
    })
    .superRefine((datos, contexto) =>
    {
      ['Matricula_Nomina', 'Nombre_Usuario'].forEach((campo) =>
      {
        if (datos[campo] !== undefined)
        {
          contexto.addIssue({
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
    estatus: z.enum(['Activo', 'Inactivo']).optional(),
  }),

  carga_confirmar: z.object({
    cuentas: z
      .array(
        z.object({
          Matricula_Nomina: z.preprocess(ConvertirATexto, z.string().trim().min(1).max(13)),
          id_perfil: id.optional().nullable(),
        }),
      )
      .min(1, 'Selecciona al menos una cuenta.')
      .max(5000),
  }),

  bajas_confirmar: z.object({ ids: z.array(id).min(1, 'Selecciona al menos un usuario.') }),

  perfil: z.object({
    Nombre_Rol: z.string().trim().min(1).max(150),
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
    Descripcion_Perfil: Requerido(150),
  }),

  perfil_funciones: z.object({ funciones: z.array(id) }),

  funcion: z.object({
    Nombre_Funcion: z.string().trim().min(1).max(150),
    Estatus: z.enum(['Activo', 'Inactivo']).optional(),
    Descripcion_Funcion: Requerido(150),
  }),

  // Catálogo ------------------------------------------------------------
  editorial: z.object({
    Nombre_Editorial: Requerido(150),
    Pais: Requerido(150),
  }),

  autor: z.object({
    Nombre: z.string().trim().min(1).max(150),
    Segundo_Nombre: TextoOpcional(150),
    Apellido_Paterno: z.string().trim().min(1).max(150),
    Apellido_Materno: TextoOpcional(150),
  }),

  tema: z.object({
    Nombre_Tema: z.string().trim().min(1).max(150),
    Descripcion: TextoOpcional(150),
  }),

  libro_busqueda: z.object({
    ...paginacion,
    limit: z.coerce.number().int().min(1).max(200).default(6),
    campo: z
      .enum(['todos', 'titulo', 'autor', 'editorial', 'isbn', 'anio', 'tema'])
      .default('todos'),
    // El orden lo da el filtro (campo); «disponibles» es solo para los recomendados del móvil.
    orden: z.enum(['disponibles']).optional(),
    desde: z.coerce.number().int().min(0).max(9999).optional(),
    hasta: z.coerce.number().int().min(0).max(9999).optional(),
    tema: id.optional(),
    editorial: id.optional(),
    disponibles: booleano.optional(),
    inactivos: booleano.optional(),
  }),

  libro_crear: z.object({
    ISBN: isbn,
    Titulo: Requerido(150),
    Autor: Requerido(300),
    id_editorial: z.preprocess(
      (valor) => (typeof valor === 'number' ? String(valor) : valor || undefined),
      z.string({ error: obligatorio }).regex(/^\d{1,13}$/, obligatorio),
    ),
    Anio: anio_cuatro_digitos,
    Tema: Requerido(200),
    Sinopsis: Requerido(150),
    Precio: z.coerce
      .number({ error: 'Debe ser un precio mayor a $0.00 en pesos mexicanos.' })
      .positive(
        'Debe ser un precio mayor a $0.00 en pesos mexicanos; no se aceptan cero ni negativos.',
      ),
  }),

  libro_actualizar: z.object({
    ISBN: z.string().trim().optional(),
    Titulo: Requerido(150).optional(),
    Autor: Requerido(300).optional(),
    id_editorial: id.optional(),
    Anio: anio_cuatro_digitos.optional(),
    Tema: Requerido(200).optional(),
    Sinopsis: Requerido(150).optional(),
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
    Pasillo: ComponenteUbicacion(10),
    Estante: ComponenteUbicacion(30),
    Nivel: ComponenteUbicacion(10),
    Seccion: ComponenteUbicacion(80),
    Estatus: z.enum(['Disponible', 'Consulta Externa']).optional(),
  }),

  ejemplar_params: z.object({ id, num_copia }),

  ejemplar_actualizar: z.object({
    Estatus: z
      .enum(['Disponible', 'Consulta Externa'], {
        error: '«En préstamo» lo asigna el sistema; elige Disponible o Consulta Externa.',
      })
      .optional(),
    Pasillo: ComponenteUbicacion(10),
    Estante: ComponenteUbicacion(30),
    Nivel: ComponenteUbicacion(10),
    Seccion: ComponenteUbicacion(80),
  }),

  ejemplar_baja: z.object({
    Motivo_Baja: z.enum(['Perdido', 'Robado', 'Danado', 'Obsoleto'], {
      error: 'Elige el motivo de la baja.',
    }),
  }),

  // Adquisiciones -------------------------------------------------------
  nuevo_libro: z.object({
    ISBN: isbn,
    Titulo: Requerido(150),
    Autor: Requerido(150),
    Editorial: Requerido(150),
    Precio: z.coerce.number().min(0).default(0),
    Anio: anio_cuatro_digitos.optional().nullable(),
    Tema: TextoOpcional(150),
    Sinopsis: TextoOpcional(150),
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
                Titulo: Requerido(150),
                Autor: Requerido(150),
                id_editorial: id.optional(),
                Editorial: TextoOpcional(150),
                Anio: anio_cuatro_digitos,
                Tema: Requerido(150),
                Sinopsis: Requerido(150),
                Precio: z.coerce.number().min(0).default(0),
              })
              .optional(),
            Num_Ejemplares: numero_copias,
            Justificacion: TextoOpcional(150),
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
          Justificacion: TextoOpcional(150),
        }),
      )
      .default([]),
  }),

  orden_filtros: z.object({
    ...paginacion,
    estatus: z.enum(['Pendiente', 'En revision', 'Aprobada', 'Rechazada', 'Recibida']).optional(),
  }),

  // Aprobar o rechazar le corresponde a Tesorería; en Biblio solo se registra la recepción.
  orden_estatus: z.object({
    Estatus: z.enum(['Recibida'], { error: 'Solo se puede marcar como Recibida' }),
  }),

  respuesta_tesoreria: z.object({
    folio: z.string().trim().min(1).max(40),
    referencia: z.preprocess(ConvertirATexto, z.string().regex(/^\d+$/)),
    estatus: z.enum(['Aceptada', 'Rechazada']),
    motivo: z.string().trim().max(255).optional().nullable(),
  }),
};

export { esquemas };
