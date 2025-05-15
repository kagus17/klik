-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Maj 15, 2025 at 09:45 AM
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

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `player1_id` int(11) NOT NULL,
  `player2_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `code`, `player1_id`, `player2_id`, `created_at`) VALUES
(1, 'CELTA0', 2, NULL, '2025-04-11 18:48:43'),
(2, '1LY0SV', 4, 4, '2025-04-11 18:49:46'),
(3, '3CYYNF', 2, 4, '2025-05-09 05:50:07'),
(4, 'TWMDNN', 2, NULL, '2025-05-09 05:59:43'),
(5, '24IW26', 2, 4, '2025-05-09 06:00:39'),
(6, 'AKPRTK', 4, 4, '2025-05-09 06:07:31'),
(7, 'JRDJU6', 4, 4, '2025-05-09 06:11:35'),
(8, 'R7FEQI', 4, 4, '2025-05-09 06:19:10'),
(9, 'BUNW0E', 4, 4, '2025-05-09 06:24:17'),
(10, 'K9P035', 2, 2, '2025-05-09 06:27:24'),
(11, '7QXG6M', 2, 4, '2025-05-09 06:32:09'),
(12, 'OODRI7', 4, 4, '2025-05-09 06:38:26'),
(13, 'IHAYTH', 2, 4, '2025-05-09 06:41:07'),
(14, 'RD8QQ5', 2, 4, '2025-05-09 06:46:31'),
(15, 'ZZ4VLU', 2, 4, '2025-05-09 11:57:05'),
(16, 'VEOUV8', 4, NULL, '2025-05-09 11:58:54'),
(17, 'UK48M1', 2, 4, '2025-05-12 05:42:41'),
(18, 'SG6ANZ', 2, NULL, '2025-05-12 05:54:11'),
(19, 'F0MFQR', 2, NULL, '2025-05-12 05:56:53'),
(20, 'B2YOM8', 2, NULL, '2025-05-12 05:58:01'),
(21, 'XDDZT0', 2, NULL, '2025-05-12 06:06:17'),
(22, 'P592OY', 2, NULL, '2025-05-12 06:28:03'),
(23, 'XTNDLX', 2, NULL, '2025-05-12 06:30:25'),
(24, 'HFG8EO', 2, 4, '2025-05-12 06:40:35'),
(25, '69KYO6', 2, 4, '2025-05-12 08:07:38'),
(26, '7ZNE5I', 4, 2, '2025-05-12 08:12:55'),
(27, 'PDYOAH', 2, 4, '2025-05-12 08:19:25'),
(28, 'P23VJ8', 2, 4, '2025-05-12 08:21:38'),
(29, '4LUFW4', 2, 4, '2025-05-12 10:46:19'),
(30, 'DQR6YD', 4, 4, '2025-05-12 10:58:31'),
(31, '4KV227', 2, 4, '2025-05-12 11:15:10'),
(32, 'AYNCA1', 2, 4, '2025-05-12 11:23:32'),
(33, 'V8D5NN', 4, 2, '2025-05-12 11:36:31'),
(34, 'NM65RC', 2, 2, '2025-05-12 12:25:33'),
(35, '23IUHK', 4, 4, '2025-05-12 12:39:21'),
(36, 'NIH0BN', 4, 2, '2025-05-12 12:43:04'),
(37, 'RQ6I5J', 2, 4, '2025-05-12 12:49:09'),
(38, 'WTGXP4', 4, NULL, '2025-05-12 12:52:04'),
(39, 'E2QM66', 2, 4, '2025-05-12 12:52:18'),
(40, 'MF2F5J', 2, 4, '2025-05-13 06:11:02'),
(41, 'XBIOLU', 2, 4, '2025-05-13 06:22:45'),
(42, 'V5MSUX', 2, 4, '2025-05-13 06:25:35'),
(43, '4JTXOV', 2, 4, '2025-05-13 06:32:22'),
(44, 'MNEP6E', 4, 2, '2025-05-13 06:33:15'),
(45, 'ON6L21', 2, 4, '2025-05-13 06:43:43'),
(46, 'V36SWY', 4, 2, '2025-05-13 06:51:24'),
(47, 'Z1Y4C0', 2, 4, '2025-05-13 07:03:26'),
(48, 'XVTUFA', 2, 4, '2025-05-13 07:10:34'),
(49, '17C6JS', 2, 4, '2025-05-13 07:15:34'),
(50, 'J3SKGT', 2, 4, '2025-05-13 07:26:06'),
(51, 'DZ4478', 2, 2, '2025-05-13 07:30:24'),
(52, 'DNKSGG', 4, 4, '2025-05-13 07:33:33'),
(53, 'Y11923', 4, 2, '2025-05-13 07:36:09'),
(54, '8QSKAX', 2, 4, '2025-05-13 07:38:58'),
(55, 'MTVG45', 2, 4, '2025-05-13 08:44:21'),
(56, 'A886KV', 2, 4, '2025-05-13 08:49:10'),
(57, 'WWISEN', 2, 4, '2025-05-13 09:20:03'),
(58, 'EJOG8X', 4, 4, '2025-05-13 09:23:48'),
(59, 'JJBTYV', 2, 4, '2025-05-13 09:27:14'),
(60, '3CKOUC', 2, 4, '2025-05-13 09:29:59'),
(61, 'SC89EZ', 2, 4, '2025-05-13 09:31:47'),
(62, '75BWB9', 2, 4, '2025-05-13 10:09:47'),
(63, '9RWUYT', 2, 4, '2025-05-13 10:16:04'),
(64, 'GDJCCG', 2, NULL, '2025-05-13 10:22:01'),
(65, 'MW9SKR', 2, 4, '2025-05-13 10:22:21'),
(66, 'GUOKQB', 2, 4, '2025-05-13 10:27:23'),
(67, 'Z8D31F', 2, 4, '2025-05-13 10:28:33'),
(68, 'KK7F06', 2, 4, '2025-05-13 10:32:51'),
(69, '66ATE8', 2, 4, '2025-05-13 10:37:01'),
(70, '6178HN', 2, 4, '2025-05-13 10:41:39'),
(71, 'OKJW9H', 2, 4, '2025-05-13 10:43:03'),
(72, 'XZKTTX', 2, 4, '2025-05-13 10:48:11'),
(73, 'Q9TGIB', 2, 4, '2025-05-13 10:57:34'),
(74, '278GAK', 2, 4, '2025-05-13 11:00:12'),
(75, 'BYDZ0I', 2, 4, '2025-05-13 11:05:01'),
(76, 'JJ2S62', 2, 4, '2025-05-13 11:06:37'),
(77, 'LCGEQV', 2, 4, '2025-05-13 11:18:03'),
(78, 'TYPNXW', 2, 4, '2025-05-13 11:29:41'),
(79, 'C5E9DC', 2, 4, '2025-05-13 11:34:05'),
(80, 'CI4UGC', 2, 4, '2025-05-13 11:35:21'),
(81, '8PMJU0', 2, 4, '2025-05-13 11:44:13'),
(82, 'FPMIXK', 2, 4, '2025-05-13 11:48:21'),
(83, 'CPYHA7', 2, 4, '2025-05-13 11:49:32'),
(84, 'C1NCCO', 2, 4, '2025-05-13 11:51:59'),
(85, 'DYEBZP', 2, 4, '2025-05-13 12:01:42'),
(86, 'E2UG7X', 2, 4, '2025-05-13 12:05:13'),
(87, 'S5SW6R', 2, 4, '2025-05-13 12:12:19'),
(88, '28RR55', 4, 2, '2025-05-13 12:13:22'),
(89, 'B6NB2C', 2, 4, '2025-05-14 07:03:05'),
(90, 'KDIGG0', 2, 4, '2025-05-14 07:04:03'),
(91, 'LQW20Z', 2, 4, '2025-05-14 07:06:14'),
(92, 'NGNEM0', 2, 4, '2025-05-14 09:54:28'),
(93, 'S3JLG0', 2, 4, '2025-05-14 09:55:02'),
(94, '98KYKJ', 2, 4, '2025-05-14 09:57:06'),
(95, 'MWBQDA', 2, 4, '2025-05-14 10:01:51'),
(96, 'QC89BM', 2, 4, '2025-05-14 10:28:01'),
(97, 'SL8AMB', 2, 4, '2025-05-14 10:31:48'),
(98, '6K2OCM', 2, 4, '2025-05-14 10:35:11'),
(99, '45BM29', 2, 4, '2025-05-14 10:37:33'),
(100, 'XDZSYO', 2, 4, '2025-05-14 10:39:58'),
(101, 'FQLAUS', 2, 4, '2025-05-14 10:48:44'),
(102, 'THH2M3', 2, 4, '2025-05-14 10:49:22'),
(103, 'R6QY5W', 2, 4, '2025-05-14 10:56:51'),
(104, 'CQGXM8', 2, 4, '2025-05-14 11:05:01'),
(105, 'ZG7G5D', 2, 4, '2025-05-14 11:09:49');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `reset_token`, `reset_token_expiry`) VALUES
(2, 'test1', '$2b$10$z3uG2VPgRWEKBf/wwqfJSe0TEfCx9zQS9P6pMb6phY7wsdaW77OwK', '', NULL, NULL),
(4, 'test2', '$2b$10$iROOctfdSBXxuNL2GyA0IezrJPC5BCog1luYCbKWDqwLOwIlIvRSK', '', NULL, NULL),
(5, 'test', '$2b$10$jWZ3ZmTJ.XdD3sJpx3n6ee5y0LrUpQdrKcRidWox7OI.xH4ciwU0e', '', NULL, NULL),
(6, 'test3', '$2b$10$jQfJfY6BBzoZzS1rVVoZGemKknbPheRHuzND6PmsrIHGAxorlqiO2', '', NULL, NULL),
(7, 'Tester', '$2b$10$iB954lo69MCd7q26xZU7GOfJWEFGsdu2HDKQRt266HXrpSmNgW/eS', '', NULL, NULL),
(8, 'Tester2', '$2b$10$Q5U7daI3ti3.tx8xSo/GSeFbPogozgP28YciWsfiLhkwCigygU1SG', 'lachowski900@gmail.com', NULL, NULL);

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
-- Indeksy dla tabeli `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
