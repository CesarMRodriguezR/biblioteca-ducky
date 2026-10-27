/*
 * ******************************************************************
 * Nombre del programa: BD-SP02-GL05 · PantallaDetalle.js
 * Función: Ficha del libro con disponibilidad, ubicación y sinopsis.
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
 *     Fila              Fila de la tabla de copias con separador superior
 *     PantallaDetalle   BD-SP02-GL05 Consulta de un libro y sus copias (vista…
 * ******************************************************************
 */

/*
 * ******************************************************************
 * Instrucciones de reutilización:
 * (1) Vista del patrón MVC: solo muestra lo que recibe del controlador; nunca llama a la API.
 * (2) Los colores, espacios y tipografía se toman de tema.js; los estilos se crean con
 *     StyleSheet.create.
 * ******************************************************************
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useControladorDetalle } from '../../controladores/ControladorCatalogo';
import { ESTADOS_COPIA, CopiasTexto, UbicacionTexto } from '../../modelos/dominio';
import {
  Alerta,
  Cargando,
  ErrorCarga,
  Insignia,
  InsigniaCopia,
  Portada,
  Tarjeta,
} from '../componentes/interfaz';
import { COLORES, ESPACIO, TIPOGRAFIA } from '../tema';

/*
 * Componente: Fila
 * Objetivo: Fila de la tabla de copias con separador superior.
 * Uso: <Fila primera={…}>…</Fila>
 */
function Fila({ primera, children })
{
  return <View style={[estilos.fila, !primera && estilos.fila_borde]}>{children}</View>;
}

/*
 * Componente: PantallaDetalle
 * Objetivo: BD-SP02-GL05 Consulta de un libro y sus copias (vista según el rol).
 * Uso: <PantallaDetalle route={…} />
 */
export function PantallaDetalle({ route })
{
  const controlador = useControladorDetalle(route);
  const libro = controlador.libro;

  if (controlador.cargando && !libro)
  {
    return (
      <View style={estilos.centro}>
        <Cargando />
      </View>
    );
  }
  if (!libro)
  {
    return (
      <View style={estilos.centro}>
        {controlador.error?.status === 404 ? (
          <Alerta tipo="advertencia" titulo="No hay ningún libro registrado con esos datos." />
        ) : (
          <ErrorCarga error={controlador.error} al_reintentar={controlador.Recargar} />
        )}
      </View>
    );
  }

  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  const resumen = libro.resumen_copias ?? {};

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.fondo }}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.cabecera}>
        <Portada libro={libro} ancho={112} alto={160} />
        <Text style={estilos.titulo}>{libro.Titulo}</Text>
        <Text style={[TIPOGRAFIA.secundario, { fontSize: 15, textAlign: 'center' }]}>
          {libro.Autor} · {libro.Nombre_Editorial} · {libro.Anio}
        </Text>
        <Insignia tono={disponibles ? 'exito' : 'advertencia'} estilo={{ alignSelf: 'center' }}>
          {disponibles} de {libro.Ejemplares_Totales} disponibles
        </Insignia>
      </View>

      <Tarjeta estilo={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPin size={15} color={COLORES.texto_principal} />
          <Text style={{ fontWeight: '700', color: COLORES.texto_principal }}>Ubicación</Text>
        </View>
        <Text style={TIPOGRAFIA.secundario}>
          {UbicacionTexto(libro, libro.Seccion) || 'Sin ubicación registrada'}
        </Text>
      </Tarjeta>

      {libro.Sinopsis ? (
        <View style={{ gap: 6 }}>
          <Text style={TIPOGRAFIA.subtitulo}>Sinopsis</Text>
          <Text style={[TIPOGRAFIA.cuerpo, { lineHeight: 22, color: COLORES.texto_secundario }]}>
            {libro.Sinopsis}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: ESPACIO.m }}>
        <Text style={TIPOGRAFIA.subtitulo}>Copias</Text>
        {!controlador.gestiona && !disponibles && (
          <Alerta
            tipo="advertencia"
            titulo="No hay copias disponibles por ahora"
            texto="Puedes unirte a la lista de espera en el mostrador de préstamos."
          />
        )}
        <Tarjeta estilo={{ padding: 0 }}>
          {controlador.gestiona
            ? controlador.copias.map((copia, indice) => (
              <Fila key={copia.num_copia} primera={indice === 0}>
                <Text style={estilos.codigo}>{copia.Codigo}</Text>
                <InsigniaCopia estatus={copia.Estatus} />
              </Fila>
            ))
            : ['Disponible', 'Consulta externa', 'En prestamo'].map((estado, indice) => (
              <Fila key={estado} primera={indice === 0}>
                <View style={{ gap: 6, flex: 1 }}>
                  <InsigniaCopia estatus={estado} />
                  <Text style={TIPOGRAFIA.secundario}>{ESTADOS_COPIA[estado].descripcion}</Text>
                </View>
                <Text style={estilos.conteo}>{CopiasTexto(resumen[estado] ?? 0)}</Text>
              </Fila>
            ))}
          {controlador.gestiona && !controlador.copias.length && (
            <Fila primera>
              <Text style={TIPOGRAFIA.secundario}>Sin copias activas.</Text>
            </Fila>
          )}
        </Tarjeta>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: ESPACIO.xl, paddingTop: ESPACIO.s, gap: ESPACIO.xl },
  centro: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIO.xl,
    justifyContent: 'center',
  },
  cabecera: { alignItems: 'center', gap: ESPACIO.s },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORES.texto_principal,
    textAlign: 'center',
    marginTop: ESPACIO.m,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACIO.l,
    paddingVertical: 12,
    gap: ESPACIO.m,
  },
  fila_borde: { borderTopWidth: 1, borderTopColor: COLORES.linea },
  codigo: { fontWeight: '700', fontSize: 15, color: COLORES.texto_principal },
  conteo: { fontWeight: '700', fontSize: 15, color: COLORES.texto_principal },
});
