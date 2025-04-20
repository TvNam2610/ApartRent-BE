import os
from pathlib import Path
import numpy as np
import mysql.connector
from datetime import datetime
from sqlalchemy import create_engine
import pandas as pd
from datetime import timedelta
import xlsxwriter
from PIL import ImageGrab
import win32com.client as win32
from win32com.client import Dispatch
import excel2img
def get_date_format(date):
    year = date[0:4]
    month = date[5:7]
    day = date[8:10]
    return year+month+day
def saveanh():
    today = datetime.today()
    yesterday = (today-timedelta(days=1)).isoformat()
    week = datetime.strptime(yesterday[:10], "%Y-%m-%d").strftime('%W')
    year = datetime.strptime(str(yesterday)[:10], "%Y-%m-%d").strftime("%Y")
    thisWeek=('0'+str(week))[-2:]
    date = get_date_format(yesterday)
    link = '\\\\incentive\\Scan\\Daily_Scan_Report'
    thisWeek=('0'+str(week))[-2:]
    # print(link)
    bundle_link = link+'\\'+year+'\\'+'W'+thisWeek
    
    FILE = bundle_link+ '\\'+'Daily_report_'+date+'.xlsx'
   # load the Excel workbook
saveanh()

