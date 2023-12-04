## Install instruction

Required packages:

**Create deb repo for Node.js 18**
```
NODE_MAJOR=18
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
```

**Install Required Packages**
```
sudo apt update
sudo apt install nodejs npm nginx ufw git pwgen -y
```

**Create user**
```
sudo adduser final-project
```

**Give final-project user specific sudo permisions **
```
sudo echo 'final-project ALL=(root) NOPASSWD: /usr/bin/systemctl' >> /etc/sudoers
```

**Remove nginx default site config**

```
sudo rm  /etc/nginx/sites-available/default

```

**Edit nginx site config**



```

sudo nano /etc/nginx/sites-available/podi1056

Paste the following:

server {
    listen 80;
    listen [::]:80;

    server_name _;
        
    location / {
         proxy_pass http://localhost:3000;
    }
}

Press control + x and then y to save


ln -s /etc/nginx/sites-available/podi1056 /etc/nginx/sites-enabled 
rm /etc/nginx/sites-enabled/default

systemctl start nginx
systemctl enable nginx
```

**Allow port 80 in firewall**
```
systemctl start ufw
systemctl enable ufw
ufw allow 80/tcp
```

**Login as final-project on the server**
```
su final-project
cd ~
```

**Create a copy of the repository **

Create a new repository on github using your personal github.com account
Name it "humanitarianism-game"

**Clone the app repo into local directory**
```
git clone https://github.com/ajh1043/humanitarianism-game.git
```

**Generate a personal access token on github**

Profile -> Developer Settings -> Tokens (classic)

**Set remote-url to your new repository**
```
git remote set-url origin https://USERNAME:ACCESS_TOKEN@github.com/USERNAME/humanitarianism-game.git
```



**Push Changes**
```
git push
```

Download the files from https://github.com/ajh1043/humanitarianism-game.git

Push changes

**Set up github actions for automatic deployment**

Go to YOUR Github repository -> Actions -> Runners

Click on New runner, then New self-hosted runner

Choose linux as the runner image

**Copy the commands from github into the server for adding the runner**

This includes the "download" and "configure" portions, but not "Using your self-hosted runner"

**Clone the repository**
```
cd /home/final-project/
git clone YOUR_GITHUB_URL
```

**Generate secret keys for session data and token**
``
echo "NEXT_PUBLIC_JWT_SECRET_KEY=\"$(pwgen -s -1 64)\"" > ~/secret_keys
echo "IRON-SESSION-PASSWORD=\"$(pwgen -s -1 32)\"" >> ~/secret_keys
``

**Copy the secret keys into the project's .env file**
``
cp ~/secret_keys ~/humanitarianism-game/.env
``

**Switch back to root**
```
su -
cd /home/final-project/actions-runner
```

**Setup the runner as a service**
```
./svc.sh install final-project
./svc.sh start
```

**Setup final-project as a service**
```
nano /etc/systemd/system/final-project.service
```

Enter the following:

```[Unit]
Description=Humanitarianism App

[Service]
Type=simple
User=final-project
Group=final-project
Restart=on-failure
Environment=LANG=en_US.UTF-8

#WorkingDirectory=/home/final-project/actions-runner/_work/humanitarianism-game/humanitarianism-game
WorkingDirectory=/home/final-project/humanitarianism-game
ExecStart=npm start -- --port 3000

[Install]
WantedBy=multi-user.target
```

**Enable and start service**

```
systemctl enable final-project
systemctl start final-project
```
