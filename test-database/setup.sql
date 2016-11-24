-- MySQL dump 10.13  Distrib 5.7.12, for osx10.9 (x86_64)
--
-- Host: 127.0.0.1    Database: whistlet
-- ------------------------------------------------------
-- Server version	5.7.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_tokens`
--

DROP TABLE IF EXISTS `auth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_tokens` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `token` varchar(128) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`token`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blocks`
--

DROP TABLE IF EXISTS `blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blocks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `blocked_id` bigint(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `broadcasts`
--

DROP TABLE IF EXISTS `broadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `broadcasts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `text` varchar(1024) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` blob,
  `reply_to` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `notify_user_id` bigint(20) NOT NULL,
  `read_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(64) NOT NULL,
  `description` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `follows` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `followed_id` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rebroadcasts`
--

DROP TABLE IF EXISTS `rebroadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rebroadcasts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `broadcast_id` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `signups`
--

DROP TABLE IF EXISTS `signups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `signups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `referral_id` bigint(20) DEFAULT NULL,
  `email` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `snapshots`
--

DROP TABLE IF EXISTS `snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `snapshots` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `followers_count` int(11) DEFAULT NULL,
  `broadcasts_count` int(11) DEFAULT NULL,
  `rebroadcasts_count` int(11) DEFAULT NULL,
  `replies_count` int(11) DEFAULT NULL,
  `referrals_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(128) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `password` varchar(128) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(128) NOT NULL,
  `avatar_url` varchar(256) DEFAULT NULL,
  `salt` varchar(64) DEFAULT NULL,
  `amp` int(11) DEFAULT 0,
  PRIMARY KEY (`id`,`username`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

INSERT INTO `users` (`id`, `username`, `name`, `password`, `created_at`, `updated_at`, `email`, `avatar_url`, `salt`, `amp`)
VALUES
(1, 'testuser1', 'Ayy lmao', 'b6d930cd92a68847a9b9f73f2a3ddb39b5d225ea156e3f842da62f8e48f60c32fecd90f159d8eab5aac6a7b393f81d4e0c1cd9ca524ba51c7cdf431c215eb761', '2016-09-29 14:54:06', NULL, 'abc@email.com', NULL, '45c8570cbae97001f88df344e8a71e17a98a45105ada4202c8660f339d8267e3', 0),
(2, 'testuser2', 'Jemz', '77b05e0cc6052af48be682e4954ceeb57c2289da264c72e55a1c7c7555cdd0e154c886c5933f1fbab22e30c45a4e68e6a0105c68f6c862e34ea48d6009633c70', '2016-11-24 20:21:09', '2016-11-24 20:21:09', 'test2@email.com', NULL, '2873a165890bf58d486094645d1801bdc74f673320459ef533b436de82b7f2e1', 0),
(3, 'testuser3', 'garlic salt', 'ece02de51aab54f6b7588bb1bebf3a5780b83145671475c3f763738b43fda2ab302897c82e7b94672953da5358072c114f52f03a3b178be45b0d9cdddcb56a28', '2016-11-24 20:22:13', '2016-11-24 20:22:13', 'test3@email.com', NULL, 'b05c56ebe9fec3d614d377c10c4da341d8a531e2760a7a48454127942cdf7940', 0);

INSERT INTO `follows` (`id`, `user_id`, `followed_id`, `created_at`)
VALUES
(1, 1, 2, '2016-11-24 20:22:13'),
(2, 2, 1, '2016-11-24 20:22:13'),
(3, 1, 3, '2016-11-24 20:22:13');

INSERT INTO `auth_tokens` (`id`, `token`, `user_id`, `created_at`)
VALUES
(1, '3f6c1e33e92992c8d58d74ce189a9df7196d7fdefaf61f0297571fd2062514a0767a07ba5da3da79dea17b99f4e8359a0cf7531ef1f917a938b91d4fbe66443a', 1, '2016-11-11 21:28:04'),
(2, 'a8ecf9c56c6046c81fc7fccf77f57de288f60eb3999461de700fe6b024a0b86ceb15cb0a1fd2ce7b25fe674f8e6189668e09a924a55e2a950dd12e7518fa0565', 2, '2016-11-18 01:07:48'),
(3, 'e2e191b0803762217a8f60872119e49d92ba05bb6ce0cc09fa858c806286450ed652d2453dda1ef5ffe7bb36da4ca392bdbe4df8bccccd5fdfdae1d8b5d84247', 3, '2016-11-18 01:54:15');

INSERT INTO `broadcasts` (`id`, `user_id`, `text`, `created_at`, `metadata`, `reply_to`)
VALUES
(1, 1, 'This is an old broadcast by testuser 1', '2016-11-18 00:39:43', NULL, NULL),
(2, 1, 'This is a recent broadcast by testuser 1', NOW(), NULL, NULL),
(3, 2, 'This is a recent broadcast by testuser 2', NOW(), NULL, NULL),
(4, 3, 'This is a recent broadcast by testuser 3', NOW(), NULL, NULL);

INSERT INTO `rebroadcasts` (`id`, `user_id`, `broadcast_id`, `created_at`)
VALUES
(1, 2, 1, '2016-11-18 01:31:09'),
(2, 2, 2, NOW()),
(3, 1, 3, NOW()),
(4, 3, 3, NOW());



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-07-09 17:39:44
