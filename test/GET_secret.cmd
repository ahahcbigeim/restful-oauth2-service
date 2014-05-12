@echo Only the first of of the following requests should success. The others should be throttled.

@curl -H "Authorization:Bearer oauth-cc-token" http://localhost:3030/secret
@echo.
@curl -H "Authorization:Bearer oauth-cc-token" http://localhost:3030/secret
@echo.
@curl -H "Authorization:Bearer oauth-cc-token" http://localhost:3030/secret
@echo.
@curl -H "Authorization:Bearer oauth-cc-token" http://localhost:3030/secret
@echo.
@curl -H "Authorization:Bearer oauth-cc-token" http://localhost:3030/secret
@echo.
