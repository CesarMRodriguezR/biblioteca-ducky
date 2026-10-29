-- =====================================================================
-- CIAA (Control Integral de Alumnos) - sistema externo simulado
-- Base de datos propia del sistema de alumnos. Biblio solo la consulta a
-- través de la API del CIAA (GET /ciaa/api/alumnos); nunca entra a esta BD.
--
-- Los datos reproducen los casos del prototipo de Figma:
--   * marcela.guerra y maria.ortiz ya tienen cuenta en Biblio.
--   * Ana Ramírez, César M. Rodríguez y Diego Flores son alumnos nuevos.
--   * Paola Treviño tiene la matrícula capturada con una letra O (error).
--   * Diego Fuentes egresó y Luis Moreno se dio de baja: ya no aparecen
--     como inscritos, así que Biblio los propone para baja.
-- =====================================================================
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS ciaa_ducky;
CREATE DATABASE ciaa_ducky
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ciaa_ducky;

CREATE TABLE Carreras (
  id_carrera  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Clave       VARCHAR(10)   NOT NULL,
  Nombre      VARCHAR(120)  NOT NULL,
  PRIMARY KEY (id_carrera),
  UNIQUE KEY uq_carreras_clave (Clave)
) ENGINE=InnoDB;

CREATE TABLE Alumnos (
  Matricula             VARCHAR(20)   NOT NULL,
  Nombre                VARCHAR(60)   NOT NULL DEFAULT '',
  Segundo_Nombre        VARCHAR(60)   NULL,
  Apellido_Paterno      VARCHAR(60)   NOT NULL DEFAULT '',
  Apellido_Materno      VARCHAR(60)   NULL,
  Correo_Institucional  VARCHAR(150)  NULL,
  Correo_Personal       VARCHAR(150)  NULL,
  Telefono              VARCHAR(20)   NULL,
  Fecha_Nacimiento      DATE          NULL,
  id_carrera            INT UNSIGNED  NOT NULL,
  Semestre              TINYINT UNSIGNED NOT NULL DEFAULT 1,
  Estatus               ENUM('Inscrito','Baja temporal','Baja definitiva','Egresado')
                        NOT NULL DEFAULT 'Inscrito',
  Fecha_Actualizacion   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (Matricula),
  CONSTRAINT fk_alumnos_carrera FOREIGN KEY (id_carrera)
    REFERENCES Carreras (id_carrera) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Carreras (id_carrera, Clave, Nombre) VALUES
  (1, 'ISC', 'Ingeniería en Sistemas Computacionales'),
  (2, 'IIS', 'Ingeniería Industrial y de Sistemas'),
  (3, 'LAE', 'Licenciatura en Administración de Empresas'),
  (4, 'LDI', 'Licenciatura en Diseño Industrial');

INSERT INTO Alumnos
  (Matricula, Nombre, Segundo_Nombre, Apellido_Paterno, Apellido_Materno, Correo_Institucional,
   Correo_Personal, Telefono, Fecha_Nacimiento, id_carrera, Semestre, Estatus) VALUES
  ('3105843', 'Marcela', NULL, 'Guerra', 'Salinas', 'marcela.guerra@ducky.edu.mx',
   'marce.guerra@correo.com', '8112345601', '2004-03-14', 1, 7, 'Inscrito'),
  ('3112390', 'María', 'Fernanda', 'Ortiz', 'Vega', 'maria.ortiz@ducky.edu.mx',
   NULL, '8112345602', '2005-07-02', 3, 5, 'Inscrito'),
  ('3098117', 'Diego', 'Alberto', 'Fuentes', 'Cano', 'diego.fuentes@ducky.edu.mx',
   NULL, '8112345603', '2002-11-20', 1, 9, 'Egresado'),
  ('3120558', 'Luis', 'Ángel', 'Moreno', 'Ríos', 'luis.moreno@ducky.edu.mx',
   NULL, '8112345604', '2004-01-09', 2, 6, 'Baja definitiva'),
  ('3105842', 'Ana', NULL, 'Ramírez', 'Torres', 'ana.ramirez@ducky.edu.mx',
   'ana.rt@correo.com', '8112345605', '2006-05-30', 1, 1, 'Inscrito'),
  ('3150221', 'César', 'Manuel', 'Rodríguez', 'Leal', 'cesarm.rodriguez@ducky.edu.mx',
   NULL, '8112345606', '2006-08-17', 4, 1, 'Inscrito'),
  ('31O5877', 'Paola', NULL, 'Treviño', 'Garza', 'paola.trevino@ducky.edu.mx',
   NULL, '8112345607', '2006-02-11', 3, 1, 'Inscrito'),
  ('3108890', 'Diego', NULL, 'Flores', 'Garza', 'diego.flores@ducky.edu.mx',
   NULL, '8112345608', '2005-12-01', 2, 3, 'Inscrito'),
  ('3089001', 'Rocío', NULL, 'Elizondo', 'Paz', 'rocio.elizondo@ducky.edu.mx',
   NULL, '8112345609', '2003-04-22', 4, 9, 'Baja temporal');
