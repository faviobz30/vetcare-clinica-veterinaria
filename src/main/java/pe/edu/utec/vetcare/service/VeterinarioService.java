package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.request.CreateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.response.VeterinarioResponse;

import java.util.List;

public interface VeterinarioService {

    List<VeterinarioResponse> getAll();

    VeterinarioResponse getById(Integer id);

    VeterinarioResponse create(CreateVeterinarioRequest request);

    VeterinarioResponse update(
            Integer id,
            UpdateVeterinarioRequest request
    );

    void delete(Integer id);
}