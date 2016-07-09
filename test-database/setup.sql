-- Host: localhost:3306
-- Generation Time: Jul 08, 2016 at 07:40 PM
-- Server version: 10.1.6-MariaDB-cll-lve
-- PHP Version: 5.4.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `whistlet`
--

--
-- Table structure for table `events`
--

-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` BIGINT NOT NULL AUTO_INCREMENT ,
  `user_id` BIGINT NOT NULL ,
  `read_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL ,
  `type` varchar(64) NOT NULL,
  `description` varchar(128) NULL,
  PRIMARY KEY (`id`, `user_id`)
);
-- --------------------------------------------------------

--
-- Table structure for table `blocks`
--

CREATE TABLE IF NOT EXISTS `blocks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT DEFAULT NULL,
  `blocked_id` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `broadcasts`
--

CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `text` varchar(1024) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `metadata` BLOB NULL,
  `reply_to` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id`,`user_id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `follows`
--

CREATE TABLE IF NOT EXISTS `follows` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `followed_id` BIGINT DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`,`user_id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `rebroadcasts`
--

CREATE TABLE IF NOT EXISTS `rebroadcasts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `broadcast_id` BIGINT NOT NULL,
  `order_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`,`user_id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `signups`
--

CREATE TABLE IF NOT EXISTS `signups` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `referral_id` BIGINT NULL,
  `email` text,
  PRIMARY KEY (`id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `user_id` BIGINT DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`,`token`)
);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` varchar(128) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `password` varchar(64) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `email` text,
  `avatar_hash` varchar(64) NOT NULL,
  `salt` varchar(32) NOT NULL,
  PRIMARY KEY (`id`,`username`)
);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
