-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Maj 14, 2025 at 01:11 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gra1v1`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `results`
--

CREATE TABLE `results` (
  `id` int(11) NOT NULL,
  `player_name` varchar(255) NOT NULL,
  `room_id` int(11) NOT NULL,
  `flips` int(11) NOT NULL,
  `time_played` int(11) NOT NULL,
  `matches` int(11) NOT NULL,
  `difficulty` enum('easy','medium','hard') NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `results`
--

INSERT INTO `results` (`id`, `player_name`, `room_id`, `flips`, `time_played`, `matches`, `difficulty`, `start_time`, `end_time`) VALUES
(1, 'Przeciwnika', 103, 6, 9, 3, 'easy', '2025-05-14 10:57:00', '2025-05-14 10:57:09'),
(2, 'Przeciwnika', 103, 10, 16, 3, 'easy', '2025-05-14 10:57:00', '2025-05-14 10:57:16'),
(3, 'test1', 105, 8, 10, 3, 'easy', '2025-05-14 11:09:54', '2025-05-14 11:10:04'),
(4, 'test2', 105, 10, 18, 3, 'easy', '2025-05-14 11:09:54', '2025-05-14 11:10:12');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `results`
--
ALTER TABLE `results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `results`
--
ALTER TABLE `results`
  ADD CONSTRAINT `results_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
