class PersonController < ApplicationController
  def index
    @people = Person.all
    respond_to do |format|
      format.html
      format.json {
        render json: @people
      }
    end
  end

  def edit
  end

  def list

  end

  def delete
  end

end
