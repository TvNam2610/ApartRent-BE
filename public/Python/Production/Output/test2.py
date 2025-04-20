import win32api
e_msg = win32api.FormatMessage(-2147352567)
print(e_msg.decode('CP1251'))