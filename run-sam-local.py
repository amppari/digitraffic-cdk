import os, yaml, subprocess, sys, time
from collections import namedtuple

Lambda = namedtuple("Lambda", "path lambdaname")

lambdas = []

def read_templates(paths):
    for path in paths:
        for f in os.listdir(path):
            joined_path = os.path.join(path, f)
            if os.path.isdir(joined_path) and os.path.isfile(os.path.join(joined_path, 'template.yaml')):
                lambdas.extend(read_lambdas(joined_path))

def read_lambdas(dir):
    dir_lambdas = []
    with open('{}/template.yaml'.format(dir)) as f:
        cf = yaml.safe_load(f)
        for key, value in cf['Resources'].items():
            if value['Type'] == 'AWS::Lambda::Function' and 'LogRetention' not in key :
                dir_lambdas.append(Lambda(path=dir, lambdaname=key))
    return dir_lambdas

read_templates(['marine', 'road'])

i = 0
for l in lambdas:
    i = i+1
    print '{}. {} {}'.format(i, l.path, l.lambdaname)

lambda_run_idx = int(raw_input())
lambda_run_actual_idx = lambda_run_idx - 1
if len(lambdas) - 1 < lambda_run_actual_idx:
    print 'Lambda with number {} not found'.format(lambda_run_idx)
else:
    devnull = open(os.devnull, 'w')
    lambda_to_run = lambdas[lambda_run_actual_idx]
    p = subprocess.Popen('cd {}; sam local invoke {} -d 9999;'.format(lambda_to_run.path, lambda_to_run.lambdaname),
                     shell=True,stdin=None,stdout=devnull,stderr=devnull,close_fds=True)
    print 'Waiting 15 s for container to start..'
    time.sleep(15)
    print '..done'
