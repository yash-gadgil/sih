# Getting Set up

## python setup

from the project's root directory

```
pip install -r requirements.txt
```

start the server and once you see 

```
 * Running on http://127.0.0.1:5000
```

upload the resumes with

```
chmod +x ./resume_uploader.sh
./resume_uploader.sh
```

2 endpoints are exposed

Uploading CVs

to manually upload a cv from a folder

```
curl -X POST -F 'file=@"File Path"' http://127.0.0.1:5000/upload-cv
```

Getting Eligible Candidates

```
curl --get 'http://127.0.0.1:5000/eligible-candidates' --data-urlencode 'q=The Requirements for the Internship' --data-urlencode 'k=6'
```

where q is the requirements text and k is the no. of candidates to be returned's limit