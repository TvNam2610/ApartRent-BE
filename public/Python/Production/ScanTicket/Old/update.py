
import cv2, os
from pathlib import Path
from pyzbar import pyzbar
import numpy as np
import time
import mysql.connector
from datetime import datetime
from sqlalchemy import create_engine
import pandas as pd
from mysql.connector import MySQLConnection, Error

hostname='10.144.12.93'
engine = create_engine('mysql+mysqlconnector://i_admin:Hy$2020@10.144.12.93:3306/linebalancing', echo=False)

sql = "UPDATE linebalancing.employee_scanticket es, pr2k.bundleticket_active ba SET es.EARNED_HOURS=ba.EARNED_HOURS, es.STYLE=ba.STYLE , es.UNITS=ba.UNITS, es.OPERATION=ba.OPERATION WHERE es.TICKET=ba.TICKET AND es.UNITS IS NULL "
data=pd.read_sql(sql,engine)
engine.dispose()
