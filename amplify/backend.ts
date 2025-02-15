import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
});

backend.addOutput({
  storage: {
    aws_region: "us-east-1",
    bucket_name: "mys3customapp"
  },
});