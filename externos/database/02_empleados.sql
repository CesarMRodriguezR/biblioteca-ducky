-- =====================================================================
-- Sistema de Empleados (Recursos Humanos) - sistema externo simulado
-- Base de datos propia del sistema de nómina. Biblio solo la consulta a
-- través de su API (GET /empleados/api/empleados); nunca entra a esta BD.
--
-- Los datos reproducen los casos del prototipo de Figma:
--   * felipe.rodriguez, catherine.ramirez, javier.saavedra y
--     cesar.rodriguez ya tienen cuenta en Biblio.
--   * Jorge Salas, Marta Ruiz y Lucía Benavides son empleados nuevos.
--   * La nómina 1004981 se capturó sin nombre (error).
--   * Héctor Villarreal causó baja: Biblio lo propone para baja.
-- =====================================================================
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS empleados_ducky;
CREATE DATABASE empleados_ducky
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE empleados_ducky;

CREATE TABLE Departamentos (
  id_departamento  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  Nombre           VARCHAR(120)  NOT NULL,
  PRIMARY KEY (id_departamento)
) ENGINE=InnoDB;

CREATE TABLE Empleados (
  Numero_Nomina         VARCHAR(20)   NOT NULL,
  Nombre                VARCHAR(60)   NOT NULL DEFAULT '',
  Segundo_Nombre        VARCHAR(60)   NULL,
  Apellido_Paterno      VARCHAR(60)   NOT NULL DEFAULT '',
  Apellido_Materno      VARCHAR(60)   NULL,
  Correo_Institucional  VARCHAR(150)  NULL,
  RFC                   VARCHAR(13)   NULL,
  Telefono              VARCHAR(20)   NULL,
  Puesto                VARCHAR(80)   NOT NULL,
  Tipo                  ENUM('Docente','Bibliotecario','Administrativo','Directivo')
                        NOT NULL,
  id_departamento       INT UNSIGNED  NOT NULL,
  Fecha_Ingreso         DATE          NOT NULL,
  Salario_Mensual       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  Estatus               ENUM('Activo','Licencia','Baja') NOT NULL DEFAULT 'Activo',
  Fecha_Actualizacion   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (Numero_Nomina),
  CONSTRAINT fk_empleados_departamento FOREIGN KEY (id_departamento)
    REFERENCES Departamentos (id_departamento) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Departamentos (id_departamento, Nombre) VALUES
  (1, 'Rectoría'),
  (2, 'Biblioteca'),
  (3, 'Facultad de Ingeniería'),
  (4, 'Servicios Escolares'),
  (5, 'Tesorería');

INSERT INTO Empleados
  (Numero_Nomina, Nombre, Segundo_Nombre, Apellido_Paterno, Apellido_Materno,
   Correo_Institucional, RFC, Telefono, Puesto, Tipo, id_departamento, Fecha_Ingreso,
   Salario_Mensual, Estatus) VALUES
  ('1001133', 'Felipe', NULL, 'Rodríguez', 'Garza', 'felipe.rodriguez@ducky.edu.mx',
   'ROGF800101AB1', '8113000001', 'Coordinador de sistemas', 'Directivo', 1, '2015-08-01',
   48000.00, 'Activo'),
  ('2004720', 'Catherine', NULL, 'Ramírez', 'Soto', 'catherine.ramirez@ducky.edu.mx',
   'RASC900202AB2', '8113000002', 'Bibliotecaria', 'Bibliotecario', 2, '2019-01-15',
   21000.00, 'Activo'),
  ('1987345', 'Javier', NULL, 'Saavedra', 'López', 'javier.saavedra@ducky.edu.mx',
   'SALJ750303AB3', '8113000003', 'Profesor de tiempo completo', 'Docente', 3,
   '2010-08-16', 36000.00, 'Activo'),
  ('2005872', 'César', NULL, 'Rodríguez', 'Mena', 'cesar.rodriguez@ducky.edu.mx',
   'ROMC880404AB4', '8113000004', 'Auxiliar administrativo', 'Administrativo', 4,
   '2020-02-03', 16000.00, 'Activo'),
  ('2005871', 'Héctor', NULL, 'Villarreal', 'Cruz', 'hector.villarreal@ducky.edu.mx',
   'VICH850505AB5', '8113000005', 'Auxiliar administrativo', 'Administrativo', 4,
   '2018-06-11', 15500.00, 'Baja'),
  ('1002745', 'Jorge', 'Emilio', 'Salas', 'Medina', 'jorge.salas@ducky.edu.mx',
   'SAMJ820606AB6', '8113000006', 'Profesor de asignatura', 'Docente', 3, '2026-08-10',
   18000.00, 'Activo'),
  ('2004518', 'Marta', NULL, 'Ruiz', 'Herrera', 'marta.ruiz@ducky.edu.mx',
   'RUHM910707AB7', '8113000007', 'Analista de tesorería', 'Administrativo', 5,
   '2026-09-01', 19000.00, 'Activo'),
  ('2002214', 'Lucía', NULL, 'Benavides', 'Cantú', 'lucia.benavides@ducky.edu.mx',
   'BECL930808AB8', '8113000008', 'Auxiliar de biblioteca', 'Bibliotecario', 2,
   '2026-09-15', 15000.00, 'Activo'),
  ('1004981', '', NULL, '', NULL, NULL,
   NULL, '8113000009', 'Profesor de asignatura', 'Docente', 3, '2026-10-01',
   18000.00, 'Activo');
