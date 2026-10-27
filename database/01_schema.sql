-- =====================================================================
-- Biblioteca Ducky - Esquema de base de datos (MariaDB 10.6+)
-- Fuente: "Ing. Softw - Biblioteca Ducky - Base de Datos.drawio"
--         (página "Diagrama ER" y vistas por módulo)
--
-- Notas de traducción del diagrama:
--   * "Año" se nombra Anio para evitar caracteres no ASCII en identificadores.
--   * "Lista de Espera" se nombra ListaEspera.
--   * Contrasena_Usuario guarda el hash bcrypt, nunca la contraseña en claro.
--   * Las cardinalidades 0,1 del diagrama se aplican con índices UNIQUE
--     (Devoluciones.id_prestamo y Multas.id_prestamo).
--   * Ejemplares, Renovaciones y las tablas puente usan llave compuesta,
--     tal como están marcadas PK,FK en el diagrama.
--
-- Agregados que exige el prototipo de Figma (marcados con [PROTOTIPO]):
--   * Usuarios: Nombre_Completo, Correo, Intentos_Fallidos. Nombre_Usuario
--     es el usuario de inicio de sesión (p. ej. ana.ramirez).
--   * Ejemplares: Codigo (EJ-00101), Pasillo, Estante, Nivel, Motivo_Baja,
--     Fecha_Alta. Estados: Disponible (solo en sala), Consulta externa (se
--     puede llevar a casa), En prestamo, Apartado (lista de espera) y Baja.
--   * NuevosLibros: Anio, Tema y Sinopsis (los pide la solicitud de compra).
--   * OrdenesCompra: estado 'En revision'.
--   * Bitacora: historial para la "Actividad reciente" del panel.
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
  id_perfil           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Nombre_Rol          VARCHAR(50)   NOT NULL,
  Estatus             ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  Descripcion_Perfil  VARCHAR(255)  NULL,
  PRIMARY KEY (id_perfil),
  UNIQUE KEY uq_perfiles_nombre (Nombre_Rol)
) ENGINE=InnoDB;

CREATE TABLE Funciones (
  id_funcion           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Nombre_Funcion       VARCHAR(80)   NOT NULL,
  Estatus              ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  Descripcion_Funcion  VARCHAR(255)  NULL,
  PRIMARY KEY (id_funcion),
  UNIQUE KEY uq_funciones_nombre (Nombre_Funcion)
) ENGINE=InnoDB;

CREATE TABLE PerfilFuncion (
  id_funcion  INT UNSIGNED NOT NULL,
  id_perfil   INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_funcion, id_perfil),
  CONSTRAINT fk_pf_funcion FOREIGN KEY (id_funcion)
    REFERENCES Funciones (id_funcion) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pf_perfil FOREIGN KEY (id_perfil)
    REFERENCES Perfiles (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Usuarios (
  id_usuario          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Nombre_Usuario      VARCHAR(60)   NOT NULL COMMENT 'Usuario de inicio de sesión',
  Contrasena_Usuario  VARCHAR(255)  NOT NULL,
  Matricula_Nomina    VARCHAR(20)   NOT NULL,
  Estatus             ENUM('Activo','Inactivo','Bloqueado') NOT NULL DEFAULT 'Activo',
  id_perfil           INT UNSIGNED  NOT NULL,
  Nombre_Completo     VARCHAR(150)  NOT NULL COMMENT '[PROTOTIPO]',
  Correo              VARCHAR(150)  NULL     COMMENT '[PROTOTIPO]',
  Intentos_Fallidos   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '[PROTOTIPO]',
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
  id_editorial      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Nombre_Editorial  VARCHAR(120)  NOT NULL,
  Pais              VARCHAR(60)   NULL,
  PRIMARY KEY (id_editorial)
) ENGINE=InnoDB;

CREATE TABLE Autores (
  id_autor          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Nombre            VARCHAR(60)  NOT NULL,
  Segundo_Nombre    VARCHAR(60)  NULL,
  Apellido_Paterno  VARCHAR(60)  NOT NULL,
  Apellido_Materno  VARCHAR(60)  NULL,
  PRIMARY KEY (id_autor),
  KEY ix_autores_apellido (Apellido_Paterno)
) ENGINE=InnoDB;

CREATE TABLE Temas (
  id_tema       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Nombre_Tema   VARCHAR(80)   NOT NULL,
  Descripcion   VARCHAR(255)  NULL,
  PRIMARY KEY (id_tema),
  UNIQUE KEY uq_temas_nombre (Nombre_Tema)
) ENGINE=InnoDB;

CREATE TABLE Libros (
  id_libro      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  ISBN          VARCHAR(17)    NOT NULL,
  Titulo        VARCHAR(200)   NOT NULL,
  Anio          SMALLINT       NULL,
  Sinopsis      TEXT           NULL,
  id_editorial  INT UNSIGNED   NOT NULL,
  id_usuario    INT UNSIGNED   NOT NULL COMMENT 'Usuario que registró el libro',
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
  id_libro  INT UNSIGNED NOT NULL,
  id_autor  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_libro, id_autor),
  CONSTRAINT fk_al_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_al_autor FOREIGN KEY (id_autor)
    REFERENCES Autores (id_autor) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE TemasLibros (
  id_libro  INT UNSIGNED NOT NULL,
  id_tema   INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_libro, id_tema),
  CONSTRAINT fk_tl_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_tl_tema FOREIGN KEY (id_tema)
    REFERENCES Temas (id_tema) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Ejemplares (
  id_libro     INT UNSIGNED NOT NULL,
  num_copia    INT UNSIGNED NOT NULL,
  Estatus      ENUM('Disponible','Consulta externa','En prestamo','Apartado','Baja')
               NOT NULL DEFAULT 'Disponible',
  Codigo       VARCHAR(12)  NOT NULL COMMENT '[PROTOTIPO] p. ej. EJ-00101',
  Pasillo      VARCHAR(10)  NULL     COMMENT '[PROTOTIPO]',
  Estante      VARCHAR(30)  NULL     COMMENT '[PROTOTIPO]',
  Nivel        VARCHAR(10)  NULL     COMMENT '[PROTOTIPO]',
  Motivo_Baja  ENUM('Perdido','Robado','Danado','Obsoleto') NULL COMMENT '[PROTOTIPO]',
  Fecha_Alta   DATE         NOT NULL DEFAULT (CURRENT_DATE) COMMENT '[PROTOTIPO]',
  PRIMARY KEY (id_libro, num_copia),
  UNIQUE KEY uq_ejemplares_codigo (Codigo),
  CONSTRAINT fk_ejemplares_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Circulación: Prestamos, Devoluciones, Renovaciones, Multas, ListaEspera
-- ---------------------------------------------------------------------
CREATE TABLE Prestamos (
  id_prestamo               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Fecha_Prestamo            DATE         NOT NULL,
  Fecha_Entrega_Programada  DATE         NOT NULL,
  Estado                    ENUM('Activo','Devuelto','Vencido') NOT NULL DEFAULT 'Activo',
  id_usuario                INT UNSIGNED NOT NULL,
  id_libro                  INT UNSIGNED NOT NULL,
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
  id_devolucion     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_prestamo       INT UNSIGNED NOT NULL,
  Fecha_Devolucion  DATE         NOT NULL,
  PRIMARY KEY (id_devolucion),
  UNIQUE KEY uq_devoluciones_prestamo (id_prestamo),
  CONSTRAINT fk_devoluciones_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES Prestamos (id_prestamo) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Renovaciones (
  id_prestamo                    INT UNSIGNED NOT NULL,
  num_prestamo                   INT UNSIGNED NOT NULL COMMENT 'Número consecutivo de renovación',
  Fecha_Renovacion               DATE         NOT NULL,
  Fecha_Previamente_Programada   DATE         NOT NULL,
  PRIMARY KEY (id_prestamo, num_prestamo),
  CONSTRAINT fk_renovaciones_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES Prestamos (id_prestamo) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Multas (
  id_multa          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  Cantidad_a_Pagar  DECIMAL(10,2)  NOT NULL,
  Fecha_Pagado      DATE           NULL COMMENT 'NULL = pendiente de pago',
  id_usuario        INT UNSIGNED   NOT NULL,
  id_prestamo       INT UNSIGNED   NULL,
  Justificacion     VARCHAR(255)   NULL,
  PRIMARY KEY (id_multa),
  UNIQUE KEY uq_multas_prestamo (id_prestamo),
  KEY ix_multas_usuario (id_usuario),
  CONSTRAINT fk_multas_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_multas_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES Prestamos (id_prestamo) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_multas_cantidad CHECK (Cantidad_a_Pagar >= 0)
) ENGINE=InnoDB;

CREATE TABLE ListaEspera (
  id_lista_espera  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Fecha_Peticion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Estatus          ENUM('En espera','Notificado','Atendido','Cancelado')
                   NOT NULL DEFAULT 'En espera',
  id_usuario       INT UNSIGNED NOT NULL,
  id_libro         INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_lista_espera),
  KEY ix_lista_libro_estatus (id_libro, Estatus, Fecha_Peticion),
  CONSTRAINT fk_lista_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lista_libro FOREIGN KEY (id_libro)
    REFERENCES Libros (id_libro) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Adquisiciones: NuevosLibros, OrdenesCompra y detalle de órdenes
-- ---------------------------------------------------------------------
CREATE TABLE NuevosLibros (
  id_libro_nuevo  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  ISBN            VARCHAR(17)    NOT NULL,
  Titulo          VARCHAR(200)   NOT NULL,
  Autor           VARCHAR(150)   NULL,
  Editorial       VARCHAR(120)   NULL,
  Precio          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  Anio            SMALLINT       NULL COMMENT '[PROTOTIPO]',
  Tema            VARCHAR(80)    NULL COMMENT '[PROTOTIPO]',
  Sinopsis        TEXT           NULL COMMENT '[PROTOTIPO]',
  PRIMARY KEY (id_libro_nuevo),
  UNIQUE KEY uq_nuevos_isbn (ISBN),
  CONSTRAINT ck_nuevos_precio CHECK (Precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE OrdenesCompra (
  id_orden       INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  id_usuario     INT UNSIGNED   NOT NULL,
  Fecha_Orden    DATE           NOT NULL,
  Estatus        ENUM('Pendiente','En revision','Aprobada','Rechazada','Recibida')
                 NOT NULL DEFAULT 'Pendiente',
  CantidadTotal  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id_orden),
  CONSTRAINT fk_ordenes_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE OrdenLibrosNuevos (
  id_orden        INT UNSIGNED  NOT NULL,
  id_libro_nuevo  INT UNSIGNED  NOT NULL,
  Justificacion   VARCHAR(255)  NULL,
  Num_Ejemplares  INT UNSIGNED  NOT NULL DEFAULT 1,
  PRIMARY KEY (id_orden, id_libro_nuevo),
  CONSTRAINT fk_oln_orden FOREIGN KEY (id_orden)
    REFERENCES OrdenesCompra (id_orden) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_oln_libro FOREIGN KEY (id_libro_nuevo)
    REFERENCES NuevosLibros (id_libro_nuevo) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_oln_cantidad CHECK (Num_Ejemplares > 0)
) ENGINE=InnoDB;

CREATE TABLE OrdenLibrosExistentes (
  id_orden        INT UNSIGNED  NOT NULL,
  id_libro        INT UNSIGNED  NOT NULL,
  Justificacion   VARCHAR(255)  NULL,
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
  id_politica  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Informacion  TEXT         NOT NULL,
  PRIMARY KEY (id_politica)
) ENGINE=InnoDB;

CREATE TABLE preguntasChatbot (
  id_preguntas  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Pregunta      VARCHAR(255)  NOT NULL,
  PRIMARY KEY (id_preguntas),
  FULLTEXT KEY ft_preguntas (Pregunta)
) ENGINE=InnoDB;

CREATE TABLE fuentesChatbot (
  id_fuentes  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Fuente      VARCHAR(255)  NOT NULL,
  PRIMARY KEY (id_fuentes)
) ENGINE=InnoDB;

CREATE TABLE contenidosChatbot (
  id_contenidos  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Respuesta      TEXT         NOT NULL,
  id_preguntas   INT UNSIGNED NOT NULL,
  id_fuentes     INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_contenidos),
  CONSTRAINT fk_contenidos_pregunta FOREIGN KEY (id_preguntas)
    REFERENCES preguntasChatbot (id_preguntas) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_contenidos_fuente FOREIGN KEY (id_fuentes)
    REFERENCES fuentesChatbot (id_fuentes) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- [PROTOTIPO] Bitácora para la "Actividad reciente" del panel
-- ---------------------------------------------------------------------
CREATE TABLE Bitacora (
  id_bitacora  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  id_usuario   INT UNSIGNED  NULL,
  Accion       VARCHAR(40)   NOT NULL,
  Descripcion  VARCHAR(255)  NOT NULL,
  Fecha        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_bitacora),
  KEY ix_bitacora_fecha (Fecha),
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuarios (id_usuario) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Vista de apoyo para búsqueda y disponibilidad en el catálogo.
-- Disponibles = copias en sala (Disponible) + para llevar (Consulta externa).
-- La ubicación del libro es la de su primera copia activa.
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
               ORDER BY a.id_autor SEPARATOR '; ') AS Autores,
  GROUP_CONCAT(DISTINCT a.Apellido_Paterno
               ORDER BY a.id_autor SEPARATOR ' & ') AS Autores_Apellidos,
  GROUP_CONCAT(DISTINCT t.Nombre_Tema ORDER BY t.Nombre_Tema SEPARATOR ', ') AS Temas,
  (SELECT COUNT(*) FROM Ejemplares x
     WHERE x.id_libro = l.id_libro
       AND x.Estatus IN ('Disponible','Consulta externa')) AS Ejemplares_Disponibles,
  (SELECT COUNT(*) FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus = 'Consulta externa') AS Ejemplares_Prestables,
  (SELECT COUNT(*) FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus <> 'Baja') AS Ejemplares_Totales,
  (SELECT x.Pasillo FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus <> 'Baja'
     ORDER BY x.num_copia LIMIT 1) AS Pasillo,
  (SELECT x.Estante FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus <> 'Baja'
     ORDER BY x.num_copia LIMIT 1) AS Estante,
  (SELECT x.Nivel FROM Ejemplares x
     WHERE x.id_libro = l.id_libro AND x.Estatus <> 'Baja'
     ORDER BY x.num_copia LIMIT 1) AS Nivel
FROM Libros l
JOIN Editoriales e         ON e.id_editorial = l.id_editorial
LEFT JOIN AutoresLibros al ON al.id_libro = l.id_libro
LEFT JOIN Autores a        ON a.id_autor = al.id_autor
LEFT JOIN TemasLibros tl   ON tl.id_libro = l.id_libro
LEFT JOIN Temas t          ON t.id_tema = tl.id_tema
GROUP BY l.id_libro;
