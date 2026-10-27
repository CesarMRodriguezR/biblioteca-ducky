import { AreaTexto, Entrada, Selector } from './ui';

/**
 * Campos de la ficha bibliográfica, compartidos por "Alta de libro",
 * "Editar libro" y "Solicitar libros".
 *   bloqueados: campos de solo lectura; ocultos: campos que no aplican.
 */
export function FormularioFicha({
  ficha, errores, cambiar, editoriales, bloqueados = [], ocultos = [], ayudas = {}, extras = {}, onIsbnBlur, onIsbnClick,
}) {
  const ver = (c) => !ocultos.includes(c);
  const lock = (c) => bloqueados.includes(c);

  return (
    <div className="grid-2" style={{ gap: '14px 16px' }}>
      {extras.antes}
      {ver('Titulo') && extras.tituloPrimero && (
        <Entrada
          className="col-completa"
          etiqueta="Título"
          value={ficha.Titulo}
          onChange={cambiar('Titulo')}
          error={errores.Titulo}
          bloqueado={lock('Titulo')}
        />
      )}
      {ver('ISBN') && (
        <div onClick={lock('ISBN') ? onIsbnClick : undefined} role="presentation">
          <Entrada
            etiqueta="ISBN"
            value={ficha.ISBN}
            onChange={cambiar('ISBN')}
            onBlur={onIsbnBlur}
            error={errores.ISBN}
            ayuda={ayudas.ISBN}
            bloqueado={lock('ISBN')}
            inputMode="numeric"
          />
        </div>
      )}
      {ver('Precio') && (
        <Entrada
          etiqueta="Precio (MXN)"
          value={ficha.Precio}
          onChange={cambiar('Precio')}
          error={errores.Precio}
          ayuda="En pesos mexicanos (MXN), p. ej. $899.00"
          inputMode="decimal"
        />
      )}
      {ver('Titulo') && !extras.tituloPrimero && (
        <Entrada
          className="col-completa"
          etiqueta="Título"
          value={ficha.Titulo}
          onChange={cambiar('Titulo')}
          error={errores.Titulo}
          bloqueado={lock('Titulo')}
        />
      )}
      {ver('Autor') && (
        <Entrada
          etiqueta="Autor"
          value={ficha.Autor}
          onChange={cambiar('Autor')}
          error={errores.Autor}
          ayuda={ayudas.Autor}
          placeholder="Apellido, Iniciales; Apellido, Iniciales"
          bloqueado={lock('Autor')}
        />
      )}
      {ver('id_editorial') && (
        lock('id_editorial')
          ? <Entrada etiqueta="Editorial" value={editoriales.find((e) => e.valor === ficha.id_editorial)?.etiqueta ?? ''} bloqueado />
          : (
            <Selector
              etiqueta="Editorial"
              value={ficha.id_editorial}
              onChange={cambiar('id_editorial')}
              opciones={editoriales}
              marcador="Selecciona una editorial"
              error={errores.id_editorial}
              ayuda={ayudas.id_editorial}
            />
          )
      )}
      {ver('Anio') && (
        <Entrada
          etiqueta="Año"
          value={ficha.Anio}
          onChange={cambiar('Anio')}
          error={errores.Anio}
          ayuda={ayudas.Anio ?? 'Número de 4 dígitos'}
          inputMode="numeric"
          maxLength={4}
          bloqueado={lock('Anio')}
        />
      )}
      {ver('Tema') && (
        <Entrada etiqueta="Tema" value={ficha.Tema} onChange={cambiar('Tema')} error={errores.Tema} bloqueado={lock('Tema')} />
      )}
      {extras.despuesDeTema}
      {ver('Sinopsis') && (
        <AreaTexto
          className="col-completa"
          etiqueta="Sinopsis"
          value={ficha.Sinopsis}
          onChange={cambiar('Sinopsis')}
          error={errores.Sinopsis}
          disabled={lock('Sinopsis')}
        />
      )}
    </div>
  );
}
