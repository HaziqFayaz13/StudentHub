USE StudentHub;

CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    grade VARCHAR(10) NOT NULL,
    
    FOREIGN KEY (semester_id)
        REFERENCES semesters(id)
        ON DELETE CASCADE
);

USE StudentHub;

INSERT INTO semesters (name)
VALUES
('Semester 1'),
('Semester 2'),
('Semester 3'),
('Semester 4');

SELECT * FROM semesters;

USE StudentHub;

INSERT INTO courses (semester_id, name, credits, grade)
VALUES
-- Semester 1
(1, 'Programming Fundamentals', 4, 'A+'),
(1, 'Engineering Mathematics I', 4, 'A'),
(1, 'Physics', 3, 'B+'),
(1, 'English Communication', 2, 'O'),

-- Semester 2
(2, 'Object Oriented Programming', 4, 'A'),
(2, 'Engineering Mathematics II', 4, 'B+'),
(2, 'Digital Logic', 3, 'A+'),
(2, 'Environmental Studies', 2, 'A'),

-- Semester 3
(3, 'Data Structures', 4, 'A+'),
(3, 'Calculus II', 4, 'B+'),
(3, 'Digital Electronics', 3, 'A'),
(3, 'Technical English', 2, 'O'),

-- Semester 4
(4, 'Operating Systems', 4, 'A'),
(4, 'Database Systems', 4, 'B+'),
(4, 'Computer Networks', 3, 'A');

SELECT * FROM courses;
USE StudentHub;
USE StudentHub;

DELETE FROM semesters
WHERE id = 5;

SELECT * FROM semesters;

ALTER TABLE courses
ADD COLUMN internal_obtained DECIMAL(5,2) NULL,
ADD COLUMN internal_total DECIMAL(5,2) NULL,
ADD COLUMN external_obtained DECIMAL(5,2) NULL,
ADD COLUMN external_total DECIMAL(5,2) NULL,
ADD COLUMN practical_internal_obtained DECIMAL(5,2) NULL,
ADD COLUMN practical_internal_total DECIMAL(5,2) NULL,
ADD COLUMN practical_external_obtained DECIMAL(5,2) NULL,
ADD COLUMN practical_external_total DECIMAL(5,2) NULL;


DESCRIBE courses;

ALTER TABLE courses
ADD COLUMN grade_point DECIMAL(4,2) NULL;

CREATE TABLE timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(255) NOT NULL,
  room VARCHAR(100),
  faculty VARCHAR(255),
  type ENUM('class', 'break', 'lunch') DEFAULT 'class',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO timetable
(day, start_time, end_time, subject, room, faculty, type)
VALUES
('Monday', '09:00:00', '10:00:00', 'Data Structures', 'CS-204', 'Dr. Meera Iyer', 'class'),
('Monday', '10:15:00', '11:15:00', 'Calculus II', 'MH-12', 'Prof. Alan Cho', 'class'),
('Monday', '11:30:00', '12:30:00', 'Operating Systems', 'CS-110', 'Dr. Priya Shah', 'class'),

('Tuesday', '09:00:00', '10:00:00', 'Digital Electronics', 'EC-18', 'Dr. James Okonkwo', 'class'),
('Tuesday', '10:15:00', '12:15:00', 'Physics Lab', 'PHY-Lab 2', 'Ms. Hannah Cole', 'class'),
('Tuesday', '14:00:00', '15:00:00', 'Technical English', 'LH-03', 'Prof. Sofia Alvarez', 'class'),

('Wednesday', '09:00:00', '10:00:00', 'Operating Systems', 'CS-110', 'Dr. Priya Shah', 'class'),
('Wednesday', '10:15:00', '11:15:00', 'Data Structures', 'CS-204', 'Dr. Meera Iyer', 'class'),
('Wednesday', '11:30:00', '12:30:00', 'Calculus II', 'MH-12', 'Prof. Alan Cho', 'class'),

('Thursday', '09:00:00', '10:00:00', 'Digital Electronics', 'EC-18', 'Dr. James Okonkwo', 'class'),
('Thursday', '10:15:00', '11:15:00', 'Technical English', 'LH-03', 'Prof. Sofia Alvarez', 'class'),
('Thursday', '14:00:00', '16:00:00', 'Data Structures', 'CS-Lab 1', 'Dr. Meera Iyer', 'class'),

('Friday', '09:00:00', '10:00:00', 'Calculus II', 'MH-12', 'Prof. Alan Cho', 'class'),
('Friday', '10:15:00', '11:15:00', 'Operating Systems', 'CS-110', 'Dr. Priya Shah', 'class'),
('Friday', '11:30:00', '12:30:00', 'Digital Electronics', 'EC-18', 'Dr. James Okonkwo', 'class'),

('Saturday', '09:00:00', '11:00:00', 'Physics Lab', 'PHY-Lab 2', 'Ms. Hannah Cole', 'class'),
('Saturday', '11:15:00', '12:15:00', 'Technical English', 'LH-03', 'Prof. Sofia Alvarez', 'class');



SELECT * FROM timetable
ORDER BY id;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DESCRIBE users;

USE StudentHub;

CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    file_data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE StudentHub;

CREATE TABLE previous_papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    semester VARCHAR(50),
    exam_year INT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    file_data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;

DESCRIBE users;

ALTER TABLE users
ADD COLUMN roll_number VARCHAR(100) NULL,
ADD COLUMN college VARCHAR(255) NULL,
ADD COLUMN program VARCHAR(255) NULL,
ADD COLUMN year_semester VARCHAR(100) NULL;

DESCRIBE users;

USE StudentHub;

SHOW TABLES;

DESCRIBE users;
DESCRIBE attendance;
DESCRIBE timetable;
DESCRIBE notes;
DESCRIBE previous_papers;
DESCRIBE semesters;
DESCRIBE courses;