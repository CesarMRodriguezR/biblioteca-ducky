import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useDetalleController } from '../../controllers/CatalogoController';
import {
  ESTADOS_COPIA, copiasTexto, ubicacionTexto,
} from '../../models/dominio';
import {
  Alerta, Cargando, ErrorCarga, Insignia, InsigniaCopia, Portada, Tarjeta,
} from '../components/ui';
import { colores, espacio, tipografia } from '../tema';

function Fila({ primera, children }) {
  return <View style={[estilos.fila, !primera && estilos.filaBorde]}>{children}</View>;
}

/** BD-SP02-GL05 Consulta de un libro y sus copias (vista según el rol). */
export function DetalleScreen({ route }) {
  const c = useDetalleController(route);
  const libro = c.libro;

  if (c.cargando && !libro) return <View style={estilos.centro}><Cargando /></View>;
  if (!libro) {
    return (
      <View style={estilos.centro}>
        {c.error?.status === 404
          ? <Alerta tipo="advertencia" titulo="No hay ningún libro registrado con esos datos." />
          : <ErrorCarga error={c.error} onReintentar={c.recargar} />}
      </View>
    );
  }

  const disponibles = libro.Ejemplares_Disponibles ?? 0;
  const resumen = libro.resumenCopias ?? {};

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={estilos.contenido}>
      <View style={estilos.cabecera}>
        <Portada libro={libro} ancho={112} alto={160} />
        <Text style={estilos.titulo}>{libro.Titulo}</Text>
        <Text style={[tipografia.secundario, { fontSize: 15, textAlign: 'center' }]}>
          {libro.Autor} · {libro.Nombre_Editorial} · {libro.Anio}
        </Text>
        <Insignia tono={disponibles ? 'exito' : 'advertencia'} estilo={{ alignSelf: 'center' }}>
          {disponibles} de {libro.Ejemplares_Totales} disponibles
        </Insignia>
      </View>

      <Tarjeta estilo={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPin size={15} color={colores.textoPrincipal} />
          <Text style={{ fontWeight: '700', color: colores.textoPrincipal }}>Ubicación</Text>
        </View>
        <Text style={tipografia.secundario}>{ubicacionTexto(libro, libro.Seccion) || 'Sin ubicación registrada'}</Text>
      </Tarjeta>

      {libro.Sinopsis ? (
        <View style={{ gap: 6 }}>
          <Text style={tipografia.subtitulo}>Sinopsis</Text>
          <Text style={[tipografia.cuerpo, { lineHeight: 22, color: colores.textoSecundario }]}>{libro.Sinopsis}</Text>
        </View>
      ) : null}

      <View style={{ gap: espacio.m }}>
        <Text style={tipografia.subtitulo}>Copias</Text>
        {!c.gestiona && !disponibles && (
          <Alerta tipo="advertencia" titulo="No hay copias disponibles por ahora" texto="Puedes unirte a la lista de espera en el mostrador de préstamos." />
        )}
        <Tarjeta estilo={{ padding: 0 }}>
          {c.gestiona ? c.copias.map((e, i) => (
            <Fila key={e.num_copia} primera={i === 0}>
              <Text style={estilos.codigo}>{e.Codigo}</Text>
              <InsigniaCopia estatus={e.Estatus} />
            </Fila>
          )) : ['Disponible', 'Consulta externa', 'En prestamo'].map((estado, i) => (
            <Fila key={estado} primera={i === 0}>
              <View style={{ gap: 6, flex: 1 }}>
                <InsigniaCopia estatus={estado} />
                <Text style={tipografia.secundario}>{ESTADOS_COPIA[estado].descripcion}</Text>
              </View>
              <Text style={estilos.conteo}>{copiasTexto(resumen[estado] ?? 0)}</Text>
            </Fila>
          ))}
          {c.gestiona && !c.copias.length && (
            <Fila primera><Text style={tipografia.secundario}>Sin copias activas.</Text></Fila>
          )}
        </Tarjeta>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.xl, paddingTop: espacio.s, gap: espacio.xl },
  centro: { flex: 1, backgroundColor: colores.fondo, padding: espacio.xl, justifyContent: 'center' },
  cabecera: { alignItems: 'center', gap: espacio.s },
  titulo: { fontSize: 22, fontWeight: '700', color: colores.textoPrincipal, textAlign: 'center', marginTop: espacio.m },
  fila: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: espacio.l, paddingVertical: 12, gap: espacio.m,
  },
  filaBorde: { borderTopWidth: 1, borderTopColor: colores.linea },
  codigo: { fontWeight: '700', fontSize: 15, color: colores.textoPrincipal },
  conteo: { fontWeight: '700', fontSize: 15, color: colores.textoPrincipal },
});
