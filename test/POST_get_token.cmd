@rem curl --user OfficialClient:s3cr3t --data grant_type=client_credentials --data username=OfficialClient --data password=s3cr3t http://localhost:3030/token

@curl -H "Authorization:Basic T2ZmaWNpYWxDbGllbnQ6czNjcjN0" --data grant_type=client_credentials --data username=OfficialClient --data password=s3cr3t http://localhost:3030/token
@rem The encoded string above is "OfficialClient:s3cr3t" (http://www.base64encode.org)
