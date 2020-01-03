import express from 'express';
import * as http from 'http';
import { Packet, PacketHeader } from '../common/Packet';
import { login } from './Auth';
import NetServer from './NetServer';

NetServer.init();
