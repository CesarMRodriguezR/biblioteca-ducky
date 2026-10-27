import { useCambioUsuarioController } from '../../../controllers/UsuariosController';
import { Pagina } from '../../layouts/AppLayout';
import {
  Alerta, AlertaError, Boton, Cargando, EnlaceVolver, Entrada, Selector, Tarjeta,
} from '../../components/ui';

/** BD-SP01-GU02 Cambio de datos de un usuario (versiones exitosa y fallida). */
export function CambioUsuarioPage() {
  const c = useCambioUsuarioController();

  return (
    <Pagina miga="Usuarios · Modificar" titulo="Cambio de datos de usuario" ancho={980}>
      <EnlaceVolver to="/usuarios">Volver a Usuarios</EnlaceVolver>
      {c.cargando && !c.usuario && <Cargando />}
      <AlertaError error={c.errorCarga} />
      {c.resultado && (
        <div className="mb-16">
          <Alerta tipo={c.resultado.tipo} titulo={c.resultado.titulo}>{c.resultado.texto}</Alerta>
        </div>
      )}
      {c.usuario && (
        <Tarjeta>
          <form onSubmit={(e) => { e.preventDefault(); c.confirmar(); }} noValidate>
            <div className="grid-2" style={{ gap: '20px 24px' }}>
              <Entrada
                etiqueta="Matrícula o número de nómina"
                value={c.usuario.Matricula_Nomina}
                bloqueado
                ayuda="Este dato no se puede modificar."
              />
              <Entrada etiqueta="Usuario" value={c.usuario.Nombre_Usuario} bloqueado ayuda="Este dato no se puede modificar." />
              <Selector
                etiqueta="Perfil / Tipo de usuario"
                value={c.form.id_perfil}
                onChange={c.cambiar('id_perfil')}
                opciones={c.perfiles.map((p) => ({ valor: String(p.id_perfil), etiqueta: p.Nombre_Rol }))}
                error={c.errores.id_perfil}
              />
              <Entrada
                etiqueta="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                value={c.form.Contrasena_Usuario}
                onChange={c.cambiar('Contrasena_Usuario')}
                error={c.errores.Contrasena_Usuario}
                ayuda="Mínimo 8 caracteres, una mayúscula y un número. Déjala vacía para conservar la actual."
              />
              <Selector
                etiqueta="Estatus de la cuenta"
                value={c.form.Estatus}
                onChange={c.cambiar('Estatus')}
                opciones={[
                  { valor: 'Activo', etiqueta: 'Activo' },
                  { valor: 'Bloqueado', etiqueta: 'Bloqueado' },
                  { valor: 'Inactivo', etiqueta: 'Inactivo' },
                ]}
                ayuda="Elige «Activo» para desbloquear una cuenta tras intentos fallidos."
              />
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--linea-divisoria)', margin: '24px 0 20px' }} />
            <div className="fila fin espacio-12">
              <Boton variante="texto" onClick={c.cancelar}>Cancelar</Boton>
              <Boton type="submit" disabled={c.enviando}>{c.enviando ? 'Guardando…' : 'Confirmar cambios'}</Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </Pagina>
  );
}
