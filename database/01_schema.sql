-- =====================================================================
-- Biblioteca Ducky - Esquema de base de datos (MariaDB 10.6+)
-- Fuente: "Ing. Softw - Biblioteca Ducky - Base de Datos.drawio"
--         (página "Diagrama ER" y vistas por módulo)
--
-- Notas de traducción del diagrama:
--   * "Año" se nombra Anio para evitar caracteres no ASCII en identificadores.
--   * Contrasena_Usuario guarda el hash bcrypt, nunca la contraseña en claro.
--   * Las llaves son VARCHAR(13), como en el diccionario de datos. No tienen
--     AUTO_INCREMENT: la API asigna texto numérico ('1', '2'…), el mayor + 1
--     (server/src/configuracion/conexion.js, SiguienteId).
--   * Las cardinalidades 0,1 del diagrama se aplican con índices UNIQUE
--     (Devoluciones.id_prestamo y Multas.id_prestamo).
--   * Ejemplares, Renovaciones y las tablas puente usan llave compuesta,
--     tal como están marcadas PK,FK en el diagrama.
--
--   * Ejemplares sigue el diagrama: id_libro, num_copia, Estatus y Ubicacion
--     (más Motivo_Baja, ver [PROTOTIPO]).
--     Ubicacion es un código P{pasillo}-E{estante}-N{nivel}-S{sección}
--     (p. ej. P4-EB-N2-SComputación) que el sistema genera e interpreta
--     (server/src/utilidades/CodigoUbicacion.js). El código visible de la copia
--     (EJ-00101) se calcula con id_libro y num_copia; no se guarda. Una copia
--     dada de baja queda 'Inactivo'.
--
-- Agregados que exige el prototipo de Figma (marcados con [PROTOTIPO]):
--   * Ejemplares: Motivo_Baja (Perdido, Robado, Danado u Obsoleto) en las copias
--     retiradas una por una. Al inactivar un libro sus copias quedan 'Inactivo'
--     sin motivo; al reactivarlo solo esas vuelven a 'Disponible'.
--   * Usuarios: Nombre_Completo y Correo. Nombre_Usuario es el usuario de
--     inicio de sesión (p. ej. ana.ramirez).
--   * LibrosNuevos: Anio, Tema y Sinopsis (los pide la solicitud de compra).
--   * OrdenesCompra: estado 'En revision' (ya la recibió Tesorería). El folio y
--     el motivo de Tesorería no se guardan: se consultan a Tesorería con la
--     referencia (id_orden).
-- =====================================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS biblioteca_ducky;
CREATE DATABASE biblioteca_ducky
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE biblioteca_ducky;

-- ---------------------------------------------------------------------
-- Gestión de usuarios: Perfiles, Funciones, PerfilFuncion, Usuarios
-- ---------------------------------------------------------------------
CREATE TABLE Perfiles (
  id_perfil           VARCHAR(13)  NOT NULL,
  Nombre_Rol          VARCHAR(150)  NOT NULL,
  Estatus             ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  Descripcion_Perfil  VARCHAR(150)  NOT NULL,
  PRIMARY KEY (id_perfil),
  UNIQUE KEY uq_perfiles_nombre (Nombre_Rol)
) ENGINE=InnoDB;

CREATE TABLE Funciones (
  id_funcion           VARCHAR(13)  NOT NULL,
  Nombre_Funcion       VARCHAR(150)  NOT NULL,
  Estatus              ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  Descripcion_Funcion  VARCHAR(150)  NOT NULL,
  PRIMARY KEY (id_funcion),
  UNIQUE KEY uq_funciones_nombre (Nombre_Funcion)
) ENGINE=InnoDB;

CREATE TABLE PerfilFuncion (
  id_funcion  VARCHAR(13)  NOT NULL,
  id_perfil   VARCHAR(13)  NOT NULL,
  PRIMARY KEY (id_funcion, id_perfil),
  CONSTRAINT fk_pf_funcion FOREIGN KEY (id_funcion)
    REFERENCES Funciones (id_funcion) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pf_perfil FOREIGN KEY (id_perfil)
    REFERENCES Perfiles (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Usuarios (
  id_usuario          VARCHAR(13)  NOT NULL,
  Nombre_Usuario      VARCHAR(150)  NOT NULL COMMENT 'Usuario de inicio de sesión',
  Contrasena_Usuario  VARCHAR(150)  NOT NULL COMMENT 'Hash bcrypt (60 caracteres)',
  Matricula_Nomina    VARCHAR(13)   NOT NULL,
  Estatus             ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  id_perfil           VARCHAR(13)  NOT NULL,
  Nombre_Completo     VARCHAR(150)  NOT NULL COMMENT '[PROTOTIPO]',
  Correo              VARCHAR(150)  NULL     COMMENT '[PROTOTIPO]',
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_matricula (Matricula_Nomina),
  UNIQUE KEY uq_usuarios_usuario (Nombre_Usuario),
  CONSTRAINT fk_usuarios_perfil FOREIGN KEY (id_perfil)
    REFERENCES Perfiles (id_perfil) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Catálogo: Editoriales, Autores, Temas, Libros y tablas puente
-- ---------------------------------------------------------------------
CREATE TABLE Editoriales (
  id_editorial      VARCHAR(13)  NOT NULL,
  Nombre_Editorial  VARCHAR(150)  NOT NULL,
  Pais              VARCHAR(150)  NOT NULL,
  PRIMARY KEY (id_editorial)
) ENGINE=InnoDB;

CREATE TABLE Autores (
  id_autor          VARCHAR(13)  NOT NULL,
  Nombre            VARCHAR(150) NOT NULL,
  Segundo_Nombre    VARCHAR(150) NULL,
  Apellido_Paterno  VARCHAR(150) NOT NULL,
  Apellido_Materno  VARCHAR(150) NULL,
  PRIMARY KEY (id_autor),
  KEY ix_autores_apellido (Apellido_Paterno)
) ENGINE=InnoDB;

CREATE TABLE Temas (
  id_tema       VARCHAR(13)  NOT NULL,
  Nombre_Tema   VARCHAR(150)  NOT NULL,
  Descripcion   VARCHAR(150)  NULL,
  PRIMARY KEY (id_tema),
  UNIQUE KEY uq_temas_nombre (Nombre_Tema)
) ENGINE=InnoDB;

CREATE TABLE Libros (
  id_libro      VARCHAR(13)  NOT NULL,
  ISBN          VARCHAR(17)    NOT NULL,
  Titulo        VARCHAR(150)   NOT NULL,
  Anio          INT            NOT NULL,
  Sinopsis      VARCHAR(150)   NOT NULL,
  id_editorial  VARCHAR(13)  NOT NULL,
  id_usuario    VARCHAR(13)  NOT NULL COMMENT 'Usuario que registró el libro',
  Precio        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  Estatus       ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (id_libro),
  UNIQUE KEY uq_libros_isbn (ISBN),
  FULLTEXT KEY ft_libros_busqueda (Titulo, Sinopsis),
  CONSTRAINT fk_libros_editorial FOREIGN KEY (id_editorial)
    REFERENCES Editoriales (id_editorial) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_libros_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_libros_precio CHECK (Precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE AutoresLibros (
  id_libro  VARCHAR(13)  NOT NULL,
  id_autor  VARCHAR(13)  NOT NULL,
  PRIMARY KEY (id_libro, id_autor),
  CONSTRAINT fk_al_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_al_autor FOREIGN KEY (id_autor)
    REFERENCES Autores (id_autor) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE TemasLibros (
  id_libro  VARCHAR(13)  NOT NULL,
  id_tema   VARCHAR(13)  NOT NULL,
  PRIMARY KEY (id_libro, id_tema),
  CONSTRAINT fk_tl_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_tl_tema FOREIGN KEY (id_tema)
    REFERENCES Temas (id_tema) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Ejemplares (
  id_libro     VARCHAR(13)  NOT NULL,
  num_copia    INT UNSIGNED NOT NULL,
  Estatus      ENUM('Disponible','En préstamo','Consulta Externa','Inactivo')
               NOT NULL DEFAULT 'Disponible',
  Ubicacion    VARCHAR(150) NOT NULL COMMENT 'Código P{pasillo}-E{estante}-N{nivel}-S{sección}',
  Motivo_Baja  ENUM('Perdido','Robado','Danado','Obsoleto') NULL
               COMMENT '[PROTOTIPO] Solo en copias retiradas una por una',
  PRIMARY KEY (id_libro, num_copia),
  CONSTRAINT fk_ejemplares_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Circulación: Prestamos, Devoluciones, Renovaciones, Multas, ListaDeEspera
-- ---------------------------------------------------------------------
CREATE TABLE Prestamos (
  id_prestamo               VARCHAR(13)  NOT NULL,
  Fecha_Prestamo            DATE         NOT NULL,
  Fecha_Entrega_Programada  DATE         NULL,
  Estado                    ENUM('Activo','Vencido','Devuelto','Perdido') NOT NULL DEFAULT 'Activo',
  id_usuario                VARCHAR(13)  NOT NULL,
  id_libro                  VARCHAR(13)  NOT NULL,
  num_copia                 INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_prestamo),
  KEY ix_prestamos_usuario_estado (id_usuario, Estado),
  CONSTRAINT fk_prestamos_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_prestamos_ejemplar FOREIGN KEY (id_libro, num_copia)
    REFERENCES Ejemplares (id_libro, num_copia) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_prestamos_fechas CHECK (Fecha_Entrega_Programada >= Fecha_Prestamo)
) ENGINE=InnoDB;

CREATE TABLE Devoluciones (
  id_devolucion     VARCHAR(13)  NOT NULL,
  id_prestamo       VARCHAR(13)  NOT NULL,
  Fecha_Devolucion  DATE         NOT NULL,
  PRIMARY KEY (id_devolucion),
  UNIQUE KEY uq_devoluciones_prestamo (id_prestamo),
  CONSTRAINT fk_devoluciones_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES Prestamos (id_prestamo) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Renovaciones (
  id_prestamo                    VARCHAR(13)  NOT NULL,
  num_prestamo                   INT UNSIGNED NOT NULL COMMENT 'Número consecutivo de renovación',
  Fecha_Renovacion               DATE         NOT NULL,
  Fecha_Previamente_Programada   DATE         NOT NULL,
  PRIMARY KEY (id_prestamo, num_prestamo),
  CONSTRAINT fk_renovaciones_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES Prestamos (id_prestamo) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Multas (
  id_multa          VARCHAR(13)  NOT NULL,
  Cantidad_a_Pagar  DECIMAL(10,2)  NOT NULL,
  Fecha_Pagado      DATE           NULL COMMENT 'NULL = pendiente de pago',
  id_usuario        VARCHAR(13)  NOT NULL,
  id_prestamo       VARCHAR(13)  NULL,
  Justificacion     VARCHAR(150)   NOT NULL,
  PRIMARY KEY (id_multa),
  UNIQUE KEY uq_multas_prestamo (id_prestamo),
  KEY ix_multas_usuario (id_usuario),
  CONSTRAINT fk_multas_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_multas_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES Prestamos (id_prestamo) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_multas_cantidad CHECK (Cantidad_a_Pagar >= 0)
) ENGINE=InnoDB;

CREATE TABLE ListaDeEspera (
  id_lista_espera  VARCHAR(13)  NOT NULL,
  Fecha_Peticion   DATE         NOT NULL DEFAULT (CURRENT_DATE),
  Estatus          ENUM('Pendiente','Notificado','Atendida','Cancelada')
                   NOT NULL DEFAULT 'Pendiente',
  id_usuario       VARCHAR(13)  NOT NULL,
  id_libro         VARCHAR(13)  NOT NULL,
  PRIMARY KEY (id_lista_espera),
  KEY ix_lista_libro_estatus (id_libro, Estatus, Fecha_Peticion),
  CONSTRAINT fk_lista_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lista_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Adquisiciones: LibrosNuevos, OrdenesCompra y detalle de órdenes
-- ---------------------------------------------------------------------
CREATE TABLE LibrosNuevos (
  id_libro_nuevo  VARCHAR(13)    NOT NULL,
  ISBN            VARCHAR(17)    NOT NULL,
  Titulo          VARCHAR(150)   NOT NULL,
  Autor           VARCHAR(150)   NOT NULL,
  Editorial       VARCHAR(150)   NOT NULL,
  Precio          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  Anio            INT            NULL COMMENT '[PROTOTIPO]',
  Tema            VARCHAR(150)   NULL COMMENT '[PROTOTIPO]',
  Sinopsis        VARCHAR(150)   NULL COMMENT '[PROTOTIPO]',
  PRIMARY KEY (id_libro_nuevo),
  UNIQUE KEY uq_nuevos_isbn (ISBN),
  CONSTRAINT ck_nuevos_precio CHECK (Precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE OrdenesCompra (
  id_orden       VARCHAR(13)  NOT NULL,
  id_usuario     VARCHAR(13)  NOT NULL,
  Fecha_Orden    DATE           NOT NULL,
  Estatus        ENUM('Pendiente','En revision','Aprobada','Rechazada','Recibida')
                 NOT NULL DEFAULT 'Pendiente',
  CantidadTotal  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id_orden),
  CONSTRAINT fk_ordenes_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE OrdenLibrosNuevos (
  id_orden        VARCHAR(13)  NOT NULL,
  id_libro_nuevo  VARCHAR(13)  NOT NULL,
  Justificacion   VARCHAR(150)  NOT NULL,
  Num_Ejemplares  INT UNSIGNED  NOT NULL DEFAULT 1,
  PRIMARY KEY (id_orden, id_libro_nuevo),
  CONSTRAINT fk_oln_orden FOREIGN KEY (id_orden)
    REFERENCES OrdenesCompra (id_orden) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_oln_libro FOREIGN KEY (id_libro_nuevo)
    REFERENCES LibrosNuevos (id_libro_nuevo) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_oln_cantidad CHECK (Num_Ejemplares > 0)
) ENGINE=InnoDB;

CREATE TABLE OrdenLibrosExistentes (
  id_orden        VARCHAR(13)  NOT NULL,
  id_libro        VARCHAR(13)  NOT NULL,
  Justificacion   VARCHAR(150)  NOT NULL,
  Num_Ejemplares  INT UNSIGNED  NOT NULL DEFAULT 1,
  PRIMARY KEY (id_orden, id_libro),
  CONSTRAINT fk_ole_orden FOREIGN KEY (id_orden)
    REFERENCES OrdenesCompra (id_orden) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ole_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_ole_cantidad CHECK (Num_Ejemplares > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Políticas y Chatbot
-- ---------------------------------------------------------------------
CREATE TABLE Politicas (
  id_politica  VARCHAR(13)  NOT NULL,
  Informacion  VARCHAR(150) NOT NULL,
  PRIMARY KEY (id_politica)
) ENGINE=InnoDB;

CREATE TABLE PreguntasChatbot (
  id_pregunta  VARCHAR(13)  NOT NULL,
  Pregunta     VARCHAR(150) NOT NULL,
  PRIMARY KEY (id_pregunta),
  FULLTEXT KEY ft_preguntas (Pregunta)
) ENGINE=InnoDB;

CREATE TABLE FuentesChatbot (
  id_fuente  VARCHAR(13)  NOT NULL,
  Fuente     VARCHAR(150) NOT NULL,
  PRIMARY KEY (id_fuente)
) ENGINE=InnoDB;

CREATE TABLE ContenidosChatbot (
  id_contenido  VARCHAR(13)  NOT NULL,
  Respuesta     VARCHAR(150) NOT NULL,
  id_pregunta   VARCHAR(13)  NOT NULL,
  id_fuente     VARCHAR(13)  NOT NULL,
  PRIMARY KEY (id_contenido),
  CONSTRAINT fk_contenidos_pregunta FOREIGN KEY (id_pregunta)
    REFERENCES PreguntasChatbot (id_pregunta) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_contenidos_fuente FOREIGN KEY (id_fuente)
    REFERENCES FuentesChatbot (id_fuente) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Vista de apoyo para búsqueda y disponibilidad en el catálogo.
-- Disponibles = copias en sala (Disponible) + para llevar (Consulta Externa).
-- La ubicación del libro es el código de su primera copia activa.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_catalogo AS
SELECT
  l.id_libro,
  l.ISBN,
  l.Titulo,
  l.Anio,
  l.Sinopsis,
  l.Precio,
  l.Estatus,
  e.id_editorial,
  e.Nombre_Editorial,
  e.Pais,
  GROUP_CONCAT(DISTINCT CONCAT_WS(', ', a.Apellido_Paterno, a.Nombre)
               ORDER BY CAST(a.id_autor AS UNSIGNED) SEPARATOR '; ') AS Autores,
  GROUP_CONCAT(DISTINCT a.Apellido_Paterno
               ORDER BY CAST(a.id_autor AS UNSIGNED) SEPARATOR ' & ') AS Autores_Apellidos,
  GROUP_CONCAT(DISTINCT t.Nombre_Tema ORDER BY t.Nombre_Tema SEPARATOR ', ') AS Temas,
  (SELECT COUNT(*) FROM Ejemplares x
     WHERE x.id_libro = l.id_libro
       AND x.Estatus IN ('Disponible','Consulta Externa')) AS Ejemplares_Disponibles,
  (SELECT COUNT(*) FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus = 'Consulta Externa') AS Ejemplares_Prestables,
  (SELECT COUNT(*) FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus <> 'Inactivo') AS Ejemplares_Totales,
  (SELECT x.Ubicacion FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus <> 'Inactivo'
     ORDER BY x.num_copia LIMIT 1) AS Ubicacion
FROM Libros l
JOIN Editoriales e         ON e.id_editorial = l.id_editorial
LEFT JOIN AutoresLibros al ON al.id_libro = l.id_libro
LEFT JOIN Autores a        ON a.id_autor = al.id_autor
LEFT JOIN TemasLibros tl   ON tl.id_libro = l.id_libro
LEFT JOIN Temas t          ON t.id_tema = tl.id_tema
GROUP BY l.id_libro;
