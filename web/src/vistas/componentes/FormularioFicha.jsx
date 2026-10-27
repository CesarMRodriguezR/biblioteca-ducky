/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL · FormularioFicha.jsx
 * Función: Campos de la ficha bibliográfica compartidos por alta, edición y solicitud de
 *          libros.
 * Autor: Equipo CCJMops
 * Fecha: 26/10/2026
 * Entrada: Props y estado del controlador de la pantalla
 * Salida: Elementos JSX de la pantalla
 * Nomenclatura: Componentes en CamelCase, hooks en use + CamelCase,
 *               variables y props en snake_case, funciones en
 *               CamelCase, constantes en SNAKE_CASE.
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Contenido de listado:
 *     Componente        Objetivo
 *     FormularioFicha   Campos de la ficha bibliográfica, compartidos por "Alta…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los estilos están en las clases de estilos-globales.css; style en línea solo para valores
 *     calculados.
 * ******************************************************************
 */

import { AreaTexto, Entrada, Selector } from './interfaz.jsx';

/*
 * Componente: FormularioFicha
 * Objetivo: Campos de la ficha bibliográfica, compartidos por "Alta de libro", "Editar libro" y
 *           "Solicitar libros". bloqueados: campos de solo lectura; ocultos: campos que no
 *           aplican.
 * Uso: <FormularioFicha ficha={…} errores={…} cambiar={…} editoriales={…} … />
 */
export function FormularioFicha({
  ficha,
  errores,
  cambiar,
  editoriales,
  bloqueados = [],
  ocultos = [],
  ayudas = {},
  extras = {},
  al_salir_isbn,
  al_tocar_isbn,
})
{
  const Ver = (controlador) => !ocultos.includes(controlador);
  const Lock = (controlador) => bloqueados.includes(controlador);

  return (
    <div className="rejilla-2" style={{ gap: '14px 16px' }}>
      {extras.antes}
      {Ver('Titulo') && extras.tituloPrimero && (
        <Entrada
          className="columna-completa"
          etiqueta="Título"
          value={ficha.Titulo}
          onChange={cambiar('Titulo')}
          error={errores.Titulo}
          bloqueado={Lock('Titulo')}
        />
      )}
      {Ver('ISBN') && (
        <div onClick={Lock('ISBN') ? al_tocar_isbn : undefined} role="presentation">
          <Entrada
            etiqueta="ISBN"
            value={ficha.ISBN}
            onChange={cambiar('ISBN')}
            onBlur={al_salir_isbn}
            error={errores.ISBN}
            ayuda={ayudas.ISBN}
            bloqueado={Lock('ISBN')}
            inputMode="numeric"
          />
        </div>
      )}
      {Ver('Precio') && (
        <Entrada
          etiqueta="Precio (MXN)"
          value={ficha.Precio}
          onChange={cambiar('Precio')}
          error={errores.Precio}
          ayuda="En pesos mexicanos (MXN), p. ej. $899.00"
          inputMode="decimal"
        />
      )}
      {Ver('Titulo') && !extras.tituloPrimero && (
        <Entrada
          className="columna-completa"
          etiqueta="Título"
          value={ficha.Titulo}
          onChange={cambiar('Titulo')}
          error={errores.Titulo}
          bloqueado={Lock('Titulo')}
        />
      )}
      {Ver('Autor') && (
        <Entrada
          etiqueta="Autor"
          value={ficha.Autor}
          onChange={cambiar('Autor')}
          error={errores.Autor}
          ayuda={ayudas.Autor}
          placeholder="Apellido, Iniciales; Apellido, Iniciales"
          bloqueado={Lock('Autor')}
        />
      )}
      {Ver('id_editorial') &&
        (Lock('id_editorial') ? (
          <Entrada
            etiqueta="Editorial"
            value={
              editoriales.find((editorial) => editorial.valor === ficha.id_editorial)?.etiqueta ??
              ''
            }
            bloqueado
          />
        ) : (
          <Selector
            etiqueta="Editorial"
            value={ficha.id_editorial}
            onChange={cambiar('id_editorial')}
            opciones={editoriales}
            marcador="Selecciona una editorial"
            error={errores.id_editorial}
            ayuda={ayudas.id_editorial}
          />
        ))}
      {Ver('Anio') && (
        <Entrada
          etiqueta="Año"
          value={ficha.Anio}
          onChange={cambiar('Anio')}
          error={errores.Anio}
          ayuda={ayudas.Anio ?? 'Número de 4 dígitos'}
          inputMode="numeric"
          maxLength={4}
          bloqueado={Lock('Anio')}
        />
      )}
      {Ver('Tema') && (
        <Entrada
          etiqueta="Tema"
          value={ficha.Tema}
          onChange={cambiar('Tema')}
          error={errores.Tema}
          bloqueado={Lock('Tema')}
        />
      )}
      {extras.despuesDeTema}
      {Ver('Sinopsis') && (
        <AreaTexto
          className="columna-completa"
          etiqueta="Sinopsis"
          value={ficha.Sinopsis}
          onChange={cambiar('Sinopsis')}
          error={errores.Sinopsis}
          disabled={Lock('Sinopsis')}
        />
      )}
    </div>
  );
}
